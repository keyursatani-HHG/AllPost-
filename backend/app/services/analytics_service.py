"""Analytics aggregation across a user's published posts."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.models.analytics import Analytics
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.schemas.analytics import AnalyticsSummary, PlatformBreakdown

_engagement = Analytics.likes + Analytics.comments + Analytics.shares


async def summary(db: AsyncSession, user_id: uuid.UUID) -> AnalyticsSummary:
    totals = (
        await db.execute(
            select(
                func.count(func.distinct(Analytics.post_id)),
                func.coalesce(func.sum(Analytics.impressions), 0),
                func.coalesce(func.sum(Analytics.reach), 0),
                func.coalesce(func.sum(_engagement), 0),
                func.coalesce(func.avg(Analytics.engagement_rate), 0),
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

    return AnalyticsSummary(
        total_posts=int(totals[0]),
        total_impressions=int(totals[1]),
        total_reach=int(totals[2]),
        total_engagement=int(totals[3]),
        average_engagement_rate=round(float(totals[4]), 3),
        by_platform=by_platform,
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
