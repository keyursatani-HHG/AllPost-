"""Shared enumerations used across models and schemas."""
from __future__ import annotations

import enum


class RoleName(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    editor = "editor"
    viewer = "viewer"


class SocialPlatform(str, enum.Enum):
    instagram = "instagram"
    tiktok = "tiktok"
    youtube = "youtube"
    x = "x"
    linkedin = "linkedin"
    facebook = "facebook"
    pinterest = "pinterest"
    threads = "threads"
    bluesky = "bluesky"
    mastodon = "mastodon"


class PostStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    publishing = "publishing"
    published = "published"
    failed = "failed"
    archived = "archived"


class ScheduleStatus(str, enum.Enum):
    queued = "queued"
    publishing = "publishing"
    published = "published"
    failed = "failed"
    canceled = "canceled"


class SubscriptionPlan(str, enum.Enum):
    free = "free"
    pro = "pro"
    business = "business"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    trialing = "trialing"
    active = "active"
    past_due = "past_due"
    canceled = "canceled"
    expired = "expired"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"
