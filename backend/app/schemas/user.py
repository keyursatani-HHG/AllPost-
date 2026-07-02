from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import RoleName


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: RoleName
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    @classmethod
    def from_model(cls, user) -> "UserRead":
        """Build from a User ORM object, flattening the role relationship."""
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role.name,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
        )


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    company: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=512)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)
