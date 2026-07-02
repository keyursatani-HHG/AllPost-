"""Post CRUD with ownership enforcement."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.models.enums import PostStatus
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PaginationParams
from app.schemas.post import PostCreate, PostUpdate


async def list_posts(
    db: AsyncSession,
    user_id: uuid.UUID,
    pagination: PaginationParams,
    status: PostStatus | None = None,
) -> tuple[list[Post], int]:
    filters = [Post.user_id == user_id]
    if status is not None:
        filters.append(Post.status == status)

    total = await db.scalar(select(func.count()).select_from(Post).where(*filters))
    result = await db.execute(
        select(Post)
        .where(*filters)
        .order_by(Post.created_at.desc())
        .limit(pagination.page_size)
        .offset(pagination.offset)
    )
    return list(result.scalars().all()), int(total or 0)


async def get_owned(db: AsyncSession, user_id: uuid.UUID, post_id: uuid.UUID) -> Post:
    post = await db.get(Post, post_id)
    if post is None:
        raise errors.not_found("Post not found")
    if post.user_id != user_id:
        raise errors.forbidden()
    return post


async def create(db: AsyncSession, user: User, data: PostCreate) -> Post:
    post = Post(
        user_id=user.id,
        content=data.content,
        media_urls=data.media_urls,
        hashtags=data.hashtags,
        status=PostStatus.draft,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def update(db: AsyncSession, post: Post, data: PostUpdate) -> Post:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    await db.commit()
    await db.refresh(post)
    return post


async def delete(db: AsyncSession, post: Post) -> None:
    await db.delete(post)
    await db.commit()
