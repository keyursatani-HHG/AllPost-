from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Text, UniqueConstraint
from app.db.types import GUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class CalendarNote(UUIDMixin, TimestampMixin, Base):
    """A free-text note a user pins to a calendar day (one per day)."""

    __tablename__ = "calendar_notes"
    __table_args__ = (
        UniqueConstraint("user_id", "note_date", name="uq_calendar_note_user_date"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    note_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
