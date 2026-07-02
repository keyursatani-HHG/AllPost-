"""Social account connections and post scheduling."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.models.enums import PostStatus, ScheduleStatus
from app.models.post import Post
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.models.user import User
from app.schemas.common import PaginationParams
from app.schemas.schedule import ScheduleCreate, SocialAccountConnect


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
