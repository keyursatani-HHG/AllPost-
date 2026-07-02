from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AnalyticsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    post_id: uuid.UUID
    social_account_id: uuid.UUID
    scheduled_post_id: uuid.UUID | None = None
    captured_at: datetime
    impressions: int
    reach: int
    likes: int
    comments: int
    shares: int
    clicks: int
    engagement_rate: float


class PlatformBreakdown(BaseModel):
    platform: str
    impressions: int
    reach: int
    engagement: int


class AnalyticsSummary(BaseModel):
    total_posts: int
    total_impressions: int
    total_reach: int
    total_engagement: int
    average_engagement_rate: float
    by_platform: list[PlatformBreakdown]
