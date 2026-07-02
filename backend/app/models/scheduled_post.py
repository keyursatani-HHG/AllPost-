from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, Text
from app.db.types import GUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import ScheduleStatus

if TYPE_CHECKING:
    from app.models.analytics import Analytics
    from app.models.post import Post
    from app.models.social_account import SocialAccount


class ScheduledPost(UUIDMixin, TimestampMixin, Base):
    """A post queued to publish on one specific social account at a time."""

    __tablename__ = "scheduled_posts"
    __table_args__ = (
        # The publisher worker scans due jobs by (status, scheduled_at).
        Index("ix_scheduled_posts_due", "status", "scheduled_at"),
    )

    post_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), index=True
    )
    social_account_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("social_accounts.id", ondelete="CASCADE"), index=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[ScheduleStatus] = mapped_column(
        SAEnum(ScheduleStatus, name="schedule_status", values_callable=lambda e: [x.value for x in e]),
        default=ScheduleStatus.queued,
        nullable=False,
    )
    external_post_id: Mapped[str | None] = mapped_column(String(190))
    error_message: Mapped[str | None] = mapped_column(Text)

    post: Mapped["Post"] = relationship(back_populates="scheduled_posts")
    social_account: Mapped["SocialAccount"] = relationship(back_populates="scheduled_posts")
    analytics: Mapped[list["Analytics"]] = relationship(back_populates="scheduled_post")
