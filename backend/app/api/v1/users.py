"""User profile and admin user-listing endpoints."""
from __future__ import annotations

import math

from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession, Pagination, require_roles
from app.models.enums import RoleName
from app.models.user import User
from app.schemas.common import Message, Page, PageMeta
from app.schemas.user import PasswordChange, UserRead, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead, summary="Get my profile")
async def get_me(current_user: CurrentUser) -> UserRead:
    return UserRead.from_model(current_user)


@router.patch("/me", response_model=UserRead, summary="Update my profile")
async def update_me(data: UserUpdate, current_user: CurrentUser, db: DbSession) -> UserRead:
    user = await user_service.update_profile(db, current_user, data)
    return UserRead.from_model(user)


@router.post("/me/change-password", response_model=Message, summary="Change my password")
async def change_password(
    data: PasswordChange, current_user: CurrentUser, db: DbSession
) -> Message:
    await user_service.change_password(
        db, current_user, data.current_password, data.new_password
    )
    return Message(message="Your password has been updated.")


@router.get(
    "",
    response_model=Page[UserRead],
    dependencies=[Depends(require_roles(RoleName.owner, RoleName.admin))],
    summary="List all users (admin only)",
)
async def list_users(db: DbSession, pagination: Pagination) -> Page[UserRead]:
    total = int(await db.scalar(select(func.count()).select_from(User)) or 0)
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .limit(pagination.page_size)
        .offset(pagination.offset)
    )
    items = [UserRead.from_model(u) for u in result.scalars().all()]
    return Page(
        items=items,
        meta=PageMeta(
            page=pagination.page,
            page_size=pagination.page_size,
            total=total,
            total_pages=math.ceil(total / pagination.page_size) if total else 0,
        ),
    )
