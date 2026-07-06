"""Background worker that publishes scheduled posts when they come due.

Started from the FastAPI lifespan (see app/main.py). Every POLL_INTERVAL_S it
scans for queued jobs whose `scheduled_at` has passed, claims them, and publishes
each via the same path immediate publishing uses.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select, update

from app.core.logging import get_logger
from app.db.session import AsyncSessionLocal
from app.models.enums import PostStatus, ScheduleStatus
from app.models.post import Post
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.services import schedule_service

logger = get_logger(__name__)

POLL_INTERVAL_S = 20
BATCH = 20


async def _recover_stuck() -> None:
    """Re-queue jobs left in `publishing` by a previous crash/restart."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            update(ScheduledPost)
            .where(ScheduledPost.status == ScheduleStatus.publishing)
            .values(status=ScheduleStatus.queued)
        )
        if result.rowcount:
            await db.commit()
            logger.info("Re-queued %d interrupted scheduled post(s)", result.rowcount)


async def _process_due_once() -> int:
    """Publish all due jobs in one pass. Returns the number successfully published."""
    published = 0
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        rows = await db.execute(
            select(ScheduledPost)
            .where(
                ScheduledPost.status == ScheduleStatus.queued,
                ScheduledPost.scheduled_at <= now,
            )
            .order_by(ScheduledPost.scheduled_at.asc())
            .limit(BATCH)
        )
        due = list(rows.scalars().all())
        if not due:
            return 0

        # Claim first so an overlapping cycle can't double-send.
        for sp in due:
            sp.status = ScheduleStatus.publishing
        await db.commit()

        for sp in due:
            post = await db.get(Post, sp.post_id)
            account = await db.get(SocialAccount, sp.social_account_id)
            if post is None or account is None:
                sp.status = ScheduleStatus.failed
                sp.error_message = "Post or account no longer exists."
                continue
            try:
                uri = await schedule_service.publish_to_account(post, account)
                sp.status = ScheduleStatus.published
                sp.published_at = datetime.now(timezone.utc)
                sp.external_post_id = uri
                post.status = PostStatus.published
                published += 1
                logger.info("Scheduled post %s published: %s", sp.id, uri)
            except Exception as exc:  # noqa: BLE001 - record per-job, keep going
                detail = getattr(exc, "detail", str(exc))
                sp.status = ScheduleStatus.failed
                sp.error_message = str(detail)[:500]
                logger.warning("Scheduled post %s failed: %s", sp.id, detail)
        await db.commit()
    return published


async def run(stop: asyncio.Event) -> None:
    """Main worker loop; exits when `stop` is set."""
    logger.info("Scheduled-post worker started (poll every %ss)", POLL_INTERVAL_S)
    try:
        await _recover_stuck()
    except Exception:  # noqa: BLE001
        logger.exception("Scheduled-post recovery failed")

    while not stop.is_set():
        try:
            n = await _process_due_once()
            if n:
                logger.info("Publisher worker sent %d scheduled post(s)", n)
        except Exception:  # noqa: BLE001 - never let one bad cycle kill the loop
            logger.exception("Publisher worker cycle failed")
        try:
            await asyncio.wait_for(stop.wait(), timeout=POLL_INTERVAL_S)
        except asyncio.TimeoutError:
            pass
    logger.info("Scheduled-post worker stopped")
