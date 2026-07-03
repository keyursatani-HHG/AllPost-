"""Social account connections and post scheduling."""
from __future__ import annotations

import pathlib
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.models.enums import PostStatus, ScheduleStatus, SocialPlatform
from app.models.post import Post
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.models.user import User
from app.schemas.common import PaginationParams
from app.schemas.schedule import ScheduleCreate, SocialAccountConnect
from app.services import bluesky

UPLOAD_DIR = pathlib.Path("uploads")
_MIME = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".gif": "image/gif",
}


# --- Social accounts ------------------------------------------------------- #
async def list_social_accounts(db: AsyncSession, user_id: uuid.UUID) -> list[SocialAccount]:
    result = await db.execute(
        select(SocialAccount)
        .where(SocialAccount.user_id == user_id)
        .order_by(SocialAccount.created_at.desc())
    )
    return list(result.scalars().all())


async def connect_account(
    db: AsyncSession, user: User, data: SocialAccountConnect
) -> SocialAccount:
    account = SocialAccount(
        user_id=user.id,
        platform=data.platform,
        external_id=data.external_id,
        handle=data.handle,
        display_name=data.display_name,
        avatar_url=data.avatar_url,
        access_token=data.access_token,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


async def disconnect_account(
    db: AsyncSession, user_id: uuid.UUID, account_id: uuid.UUID
) -> None:
    account = await db.get(SocialAccount, account_id)
    if account is None:
        raise errors.not_found("Social account not found")
    if account.user_id != user_id:
        raise errors.forbidden()
    await db.delete(account)
    await db.commit()


# --- Scheduling ------------------------------------------------------------ #
async def create_schedule(
    db: AsyncSession, user: User, data: ScheduleCreate
) -> list[ScheduledPost]:
    post = await db.get(Post, data.post_id)
    if post is None or post.user_id != user.id:
        raise errors.not_found("Post not found")

    # Verify every target account belongs to the user.
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id.in_(data.social_account_ids),
            SocialAccount.user_id == user.id,
        )
    )
    accounts = list(result.scalars().all())
    if len(accounts) != len(set(data.social_account_ids)):
        raise errors.bad_request("One or more social accounts are invalid", "invalid_accounts")

    created: list[ScheduledPost] = []
    for account in accounts:
        sp = ScheduledPost(
            post_id=post.id,
            social_account_id=account.id,
            scheduled_at=data.scheduled_at,
            status=ScheduleStatus.queued,
        )
        db.add(sp)
        created.append(sp)

    post.status = PostStatus.scheduled
    await db.commit()
    for sp in created:
        await db.refresh(sp)
    return created


async def list_scheduled(
    db: AsyncSession,
    user_id: uuid.UUID,
    pagination: PaginationParams,
    status: ScheduleStatus | None = None,
) -> tuple[list[ScheduledPost], int]:
    filters = [Post.user_id == user_id]
    if status is not None:
        filters.append(ScheduledPost.status == status)

    base = select(ScheduledPost).join(Post, ScheduledPost.post_id == Post.id).where(*filters)
    total = await db.scalar(
        select(func.count()).select_from(ScheduledPost).join(Post, ScheduledPost.post_id == Post.id).where(*filters)
    )
    result = await db.execute(
        base.order_by(ScheduledPost.scheduled_at.asc())
        .limit(pagination.page_size)
        .offset(pagination.offset)
    )
    return list(result.scalars().all()), int(total or 0)


async def cancel_scheduled(
    db: AsyncSession, user_id: uuid.UUID, scheduled_id: uuid.UUID
) -> ScheduledPost:
    sp = await db.get(ScheduledPost, scheduled_id)
    if sp is None:
        raise errors.not_found("Scheduled post not found")
    post = await db.get(Post, sp.post_id)
    if post is None or post.user_id != user_id:
        raise errors.forbidden()
    if sp.status in (ScheduleStatus.published, ScheduleStatus.publishing):
        raise errors.bad_request("Cannot cancel a post that is already publishing", "already_publishing")
    sp.status = ScheduleStatus.canceled
    await db.commit()
    await db.refresh(sp)
    return sp


# --- Bluesky (real integration) ------------------------------------------- #
async def connect_bluesky(
    db: AsyncSession, user: User, identifier: str, app_password: str
) -> SocialAccount:
    """Validate the app password against Bluesky, then save/update the account."""
    session = await bluesky.create_session(identifier, app_password)
    did = session["did"]
    handle = session["handle"]

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == user.id,
            SocialAccount.platform == SocialPlatform.bluesky,
            SocialAccount.external_id == did,
        )
    )
    acc = result.scalar_one_or_none()
    if acc is not None:
        acc.access_token = app_password
        acc.handle = handle
        acc.display_name = handle
        acc.is_active = True
    else:
        acc = SocialAccount(
            user_id=user.id,
            platform=SocialPlatform.bluesky,
            external_id=did,
            handle=handle,
            display_name=handle,
            access_token=app_password,  # encrypt at rest in production
        )
        db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc


async def publish_now(
    db: AsyncSession, user: User, post_id: uuid.UUID, account_ids: list[uuid.UUID]
) -> list[dict]:
    """Publish a post to the selected accounts immediately (real send for Bluesky)."""
    post = await db.get(Post, post_id)
    if post is None or post.user_id != user.id:
        raise errors.not_found("Post not found")

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id.in_(account_ids), SocialAccount.user_id == user.id
        )
    )
    accounts = list(result.scalars().all())
    if not accounts:
        raise errors.bad_request("No valid accounts selected", "invalid_accounts")

    # Load media bytes from disk for platforms that accept media uploads.
    images: list[tuple[bytes, str]] = []
    for url in post.media_urls or []:
        path = UPLOAD_DIR / pathlib.Path(url).name
        mime = _MIME.get(path.suffix.lower())
        if mime and path.exists():
            images.append((path.read_bytes(), mime))

    outcomes: list[dict] = []
    published_any = False
    for acc in accounts:
        sp = ScheduledPost(
            post_id=post.id,
            social_account_id=acc.id,
            scheduled_at=datetime.now(timezone.utc),
        )
        if acc.platform == SocialPlatform.bluesky and acc.access_token:
            try:
                uri = await bluesky.publish(acc.handle, acc.access_token, post.content, images)
                sp.status = ScheduleStatus.published
                sp.published_at = datetime.now(timezone.utc)
                sp.external_post_id = uri
                published_any = True
                outcomes.append({
                    "account_id": acc.id, "platform": "bluesky",
                    "status": "published", "url": bluesky.post_url(uri, acc.handle),
                })
            except Exception as exc:  # noqa: BLE001 - report per-account
                detail = getattr(exc, "detail", str(exc))
                sp.status = ScheduleStatus.failed
                sp.error_message = str(detail)[:500]
                outcomes.append({
                    "account_id": acc.id, "platform": "bluesky",
                    "status": "failed", "error": str(detail),
                })
        else:
            sp.status = ScheduleStatus.queued
            outcomes.append({
                "account_id": acc.id, "platform": acc.platform.value,
                "status": "queued",
                "error": "Live publishing isn't wired for this platform yet.",
            })
        db.add(sp)

    post.status = PostStatus.published if published_any else PostStatus.scheduled
    await db.commit()
    return outcomes
