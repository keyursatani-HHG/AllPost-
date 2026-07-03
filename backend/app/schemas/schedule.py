from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ScheduleStatus, SocialPlatform


class SocialAccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    platform: SocialPlatform
    handle: str
    display_name: str | None = None
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime


class SocialAccountConnect(BaseModel):
    platform: SocialPlatform
    external_id: str = Field(min_length=1, max_length=128)
    handle: str = Field(min_length=1, max_length=120)
    display_name: str | None = Field(default=None, max_length=160)
    avatar_url: str | None = Field(default=None, max_length=512)
    access_token: str | None = Field(default=None, max_length=2048)


class ScheduleCreate(BaseModel):
    post_id: uuid.UUID
    social_account_ids: list[uuid.UUID] = Field(min_length=1)
    scheduled_at: datetime


class ScheduleUpdate(BaseModel):
    scheduled_at: datetime | None = None
    status: ScheduleStatus | None = None


class ScheduledPostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    post_id: uuid.UUID
    social_account_id: uuid.UUID
    scheduled_at: datetime
    published_at: datetime | None = None
    status: ScheduleStatus
    external_post_id: str | None = None
    error_message: str | None = None
    created_at: datetime


class BlueskyConnect(BaseModel):
    identifier: str = Field(min_length=1, max_length=253)  # handle or email
    app_password: str = Field(min_length=1, max_length=128)


class PublishRequest(BaseModel):
    post_id: uuid.UUID
    social_account_ids: list[uuid.UUID] = Field(min_length=1)


class PublishResult(BaseModel):
    account_id: uuid.UUID
    platform: str
    status: str  # published | queued | failed
    url: str | None = None
    error: str | None = None


class PublishResponse(BaseModel):
    results: list[PublishResult]
