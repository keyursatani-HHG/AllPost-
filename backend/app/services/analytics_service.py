"""Analytics aggregation across a user's published posts."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.models.analytics import Analytics
from app.models.enums import ScheduleStatus, SocialPlatform
from app.models.post import Post
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.schemas.analytics import AnalyticsSummary, PlatformBreakdown, TopPost
from app.services import bluesky

_engagement = Analytics.likes + Analytics.comments + Analytics.shares


async def refresh_user_analytics(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Pull live engagement for the user's published Bluesky posts and upsert snapshots."""
    result = await db.execute(
        select(ScheduledPost, SocialAccount.handle)
        .join(SocialAccount, ScheduledPost.social_account_id == SocialAccount.id)
        .join(Post, ScheduledPost.post_id == Post.id)
        .where(
            Post.user_id == user_id,
            SocialAccount.platform == SocialPlatform.bluesky,
            ScheduledPost.status == ScheduleStatus.published,
            ScheduledPost.external_post_id.isnot(None),
        )
    )
    rows = result.all()
    if not rows:
        return

    uris = [sp.external_post_id for sp, _handle in rows]
    stats = await bluesky.fetch_post_stats(uris)
    if not stats:
        return

    now = datetime.now(timezone.utc)
    for sp, _handle in rows:
        s = stats.get(sp.external_post_id)
        if s is None:
            continue
        existing = (
            await db.execute(
                select(Analytics)
                .where(
                    Analytics.post_id == sp.post_id,
                    Analytics.social_account_id == sp.social_account_id,
                )
                .limit(1)
            )
        ).scalar_one_or_none()
        if existing is not None:
            existing.likes = s["likes"]
            existing.comments = s["comments"]
            existing.shares = s["shares"]
            existing.captured_at = now
        else:
            db.add(
                Analytics(
                    post_id=sp.post_id,
                    social_account_id=sp.social_account_id,
                    scheduled_post_id=sp.id,
                    likes=s["likes"],
                    comments=s["comments"],
                    shares=s["shares"],
                    impressions=0,
                    reach=0,
                    clicks=0,
                    engagement_rate=0,
                )
            )
    await db.commit()


async def summary(db: AsyncSession, user_id: uuid.UUID) -> AnalyticsSummary:
    totals = (
        await db.execute(
            select(
                func.count(func.distinct(Analytics.post_id)),
                func.coalesce(func.sum(Analytics.impressions), 0),
                func.coalesce(func.sum(Analytics.reach), 0),
                func.coalesce(func.sum(_engagement), 0),
                func.coalesce(func.avg(Analytics.engagement_rate), 0),
                func.coalesce(func.sum(Analytics.likes), 0),
                func.coalesce(func.sum(Analytics.comments), 0),
                func.coalesce(func.sum(Analytics.shares), 0),
            )
            .select_from(Analytics)
            .join(Post, Analytics.post_id == Post.id)
            .where(Post.user_id == user_id)
        )
    ).one()

    rows = (
        await db.execute(
            select(
                SocialAccount.platform,
                func.coalesce(func.sum(Analytics.impressions), 0),
                func.coalesce(func.sum(Analytics.reach), 0),
                func.coalesce(func.sum(_engagement), 0),
            )
            .select_from(Analytics)
            .join(SocialAccount, Analytics.social_account_id == SocialAccount.id)
            .join(Post, Analytics.post_id == Post.id)
            .where(Post.user_id == user_id)
            .group_by(SocialAccount.platform)
        )
    ).all()

    by_platform = [
        PlatformBreakdown(
            platform=row[0].value if hasattr(row[0], "value") else str(row[0]),
            impressions=int(row[1]),
            reach=int(row[2]),
            engagement=int(row[3]),
        )
        for row in rows
    ]

    # Top performing posts by engagement (join the metric snapshot to its post/account).
    top_rows = (
        await db.execute(
            select(
                Post.id,
                Post.content,
                Post.created_at,
                Analytics.likes,
                Analytics.comments,
                Analytics.shares,
                ScheduledPost.external_post_id,
                ScheduledPost.published_at,
                SocialAccount.handle,
            )
            .select_from(Analytics)
            .join(Post, Analytics.post_id == Post.id)
            .outerjoin(ScheduledPost, Analytics.scheduled_post_id == ScheduledPost.id)
            .outerjoin(SocialAccount, Analytics.social_account_id == SocialAccount.id)
            .where(Post.user_id == user_id)
            .order_by(_engagement.desc(), Analytics.captured_at.desc())
            .limit(5)
        )
    ).all()

    top_posts = [
        TopPost(
            post_id=r[0],
            content=r[1] or "",
            likes=int(r[3]),
            comments=int(r[4]),
            shares=int(r[5]),
            engagement=int(r[3]) + int(r[4]) + int(r[5]),
            published_at=r[7] or r[2],
            url=bluesky.post_url(r[6], r[8]) if r[6] and r[8] else None,
        )
        for r in top_rows
    ]

    return AnalyticsSummary(
        total_posts=int(totals[0]),
        total_impressions=int(totals[1]),
        total_reach=int(totals[2]),
        total_engagement=int(totals[3]),
        average_engagement_rate=round(float(totals[4]), 3),
        total_likes=int(totals[5]),
        total_comments=int(totals[6]),
        total_shares=int(totals[7]),
        by_platform=by_platform,
        top_posts=top_posts,
    )


async def list_for_post(
    db: AsyncSession, user_id: uuid.UUID, post_id: uuid.UUID
) -> list[Analytics]:
    post = await db.get(Post, post_id)
    if post is None:
        raise errors.not_found("Post not found")
    if post.user_id != user_id:
        raise errors.forbidden()
    result = await db.execute(
        select(Analytics)
        .where(Analytics.post_id == post_id)
        .order_by(Analytics.captured_at.desc())
    )
    return list(result.scalars().all())
