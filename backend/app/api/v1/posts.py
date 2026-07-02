"""Post management endpoints."""
from __future__ import annotations

import math
import uuid

from fastapi import APIRouter, Response, status

from app.api.deps import CurrentUser, DbSession, Pagination
from app.models.enums import PostStatus
from app.schemas.common import Page, PageMeta
from app.schemas.post import PostCreate, PostRead, PostUpdate
from app.services import post_service

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=Page[PostRead], summary="List my posts")
async def list_posts(
    current_user: CurrentUser,
    db: DbSession,
    pagination: Pagination,
    status: PostStatus | None = None,
) -> Page[PostRead]:
    items, total = await post_service.list_posts(db, current_user.id, pagination, status)
    return Page(
        items=[PostRead.model_validate(p) for p in items],
        meta=PageMeta(
            page=pagination.page,
            page_size=pagination.page_size,
            total=total,
            total_pages=math.ceil(total / pagination.page_size) if total else 0,
        ),
    )


@router.post(
    "", response_model=PostRead, status_code=status.HTTP_201_CREATED, summary="Create a post"
)
async def create_post(data: PostCreate, current_user: CurrentUser, db: DbSession) -> PostRead:
    post = await post_service.create(db, current_user, data)
    return PostRead.model_validate(post)


@router.get("/{post_id}", response_model=PostRead, summary="Get a post")
async def get_post(post_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> PostRead:
    post = await post_service.get_owned(db, current_user.id, post_id)
    return PostRead.model_validate(post)


@router.patch("/{post_id}", response_model=PostRead, summary="Update a post")
async def update_post(
    post_id: uuid.UUID, data: PostUpdate, current_user: CurrentUser, db: DbSession
) -> PostRead:
    post = await post_service.get_owned(db, current_user.id, post_id)
    post = await post_service.update(db, post, data)
    return PostRead.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a post")
async def delete_post(
    post_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> Response:
    post = await post_service.get_owned(db, current_user.id, post_id)
    await post_service.delete(db, post)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
