"""User read/update operations."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserUpdate


async def get_by_id(db: AsyncSession, user_id: uuid.UUID | str) -> User | None:
    if isinstance(user_id, str):
        try:
            user_id = uuid.UUID(user_id)
        except ValueError:
            return None
    return await db.get(User, user_id)


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def update_profile(db: AsyncSession, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def change_password(db: AsyncSession, user: User, current: str, new: str) -> None:
    if not verify_password(current, user.hashed_password):
        raise errors.bad_request("Current password is incorrect", "invalid_password")
    user.hashed_password = hash_password(new)
    await db.commit()
