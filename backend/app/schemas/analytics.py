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


class TopPost(BaseModel):
    post_id: uuid.UUID
    content: str
    likes: int
    comments: int
    shares: int
    engagement: int
    published_at: datetime | None = None
    url: str | None = None


class AnalyticsSummary(BaseModel):
    total_posts: int
    total_impressions: int
    total_reach: int
    total_engagement: int
    total_likes: int = 0
    total_comments: int = 0
    total_shares: int = 0
    average_engagement_rate: float
    by_platform: list[PlatformBreakdown]
    top_posts: list[TopPost] = []
