from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.types import GUID as PGUUID, JSONB

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import PostStatus

if TYPE_CHECKING:
    from app.models.analytics import Analytics
    from app.models.scheduled_post import ScheduledPost
    from app.models.user import User


class Post(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "posts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    media_urls: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    hashtags: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    status: Mapped[PostStatus] = mapped_column(
        SAEnum(PostStatus, name="post_status", values_callable=lambda e: [x.value for x in e]),
        default=PostStatus.draft,
        nullable=False,
        index=True,
    )

    author: Mapped["User"] = relationship(back_populates="posts")
    scheduled_posts: Mapped[list["ScheduledPost"]] = relationship(
        back_populates="post", cascade="all, delete-orphan"
    )
    analytics: Mapped[list["Analytics"]] = relationship(
        back_populates="post", cascade="all, delete-orphan"
    )
