from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, func
from app.db.types import GUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.post import Post
    from app.models.scheduled_post import ScheduledPost
    from app.models.social_account import SocialAccount


class Analytics(UUIDMixin, TimestampMixin, Base):
    """A point-in-time metrics snapshot for a published post on a platform."""

    __tablename__ = "analytics"

    post_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), index=True
    )
    social_account_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("social_accounts.id", ondelete="CASCADE"), index=True
    )
    scheduled_post_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("scheduled_posts.id", ondelete="SET NULL")
    )

    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    impressions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reach: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shares: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    clicks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    engagement_rate: Mapped[float] = mapped_column(Numeric(6, 3), default=0, nullable=False)

    post: Mapped["Post"] = relationship(back_populates="analytics")
    social_account: Mapped["SocialAccount"] = relationship(back_populates="analytics")
    scheduled_post: Mapped["ScheduledPost"] = relationship(back_populates="analytics")
