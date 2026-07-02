from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PostStatus


class PostBase(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    media_urls: list[str] = Field(default_factory=list, max_length=10)
    hashtags: list[str] = Field(default_factory=list, max_length=30)


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=5000)
    media_urls: list[str] | None = Field(default=None, max_length=10)
    hashtags: list[str] | None = Field(default=None, max_length=30)
    status: PostStatus | None = None


class PostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    content: str
    media_urls: list[str]
    hashtags: list[str]
    status: PostStatus
    created_at: datetime
    updated_at: datetime
