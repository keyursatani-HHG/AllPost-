from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, String, UniqueConstraint
from app.db.types import GUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import SocialPlatform

if TYPE_CHECKING:
    from app.models.analytics import Analytics
    from app.models.scheduled_post import ScheduledPost
    from app.models.user import User


class SocialAccount(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "social_accounts"
    __table_args__ = (
        UniqueConstraint("user_id", "platform", "external_id", name="uq_social_account_identity"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    platform: Mapped[SocialPlatform] = mapped_column(
        SAEnum(SocialPlatform, name="social_platform", values_callable=lambda e: [x.value for x in e]),
        nullable=False,
        index=True,
    )
    external_id: Mapped[str] = mapped_column(String(128), nullable=False)
    handle: Mapped[str] = mapped_column(String(120), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(160))
    avatar_url: Mapped[str | None] = mapped_column(String(512))

    # NOTE: encrypt these at rest (e.g. KMS / pgcrypto) in production.
    access_token: Mapped[str | None] = mapped_column(String(2048))
    refresh_token: Mapped[str | None] = mapped_column(String(2048))
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates="social_accounts")
    scheduled_posts: Mapped[list["ScheduledPost"]] = relationship(back_populates="social_account")
    analytics: Mapped[list["Analytics"]] = relationship(back_populates="social_account")
