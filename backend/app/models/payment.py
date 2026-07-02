from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String
from app.db.types import GUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import PaymentStatus

if TYPE_CHECKING:
    from app.models.subscription import Subscription
    from app.models.user import User


class Payment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    subscription_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="SET NULL"), index=True
    )
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="usd", nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status", values_callable=lambda e: [x.value for x in e]),
        default=PaymentStatus.pending,
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(40), default="stripe", nullable=False)
    external_payment_id: Mapped[str | None] = mapped_column(String(190), index=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship()
    subscription: Mapped["Subscription"] = relationship(back_populates="payments")
