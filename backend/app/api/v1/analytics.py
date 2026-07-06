"""Analytics endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.analytics import AnalyticsRead, AnalyticsSummary
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary, summary="Aggregate analytics summary")
async def get_summary(current_user: CurrentUser, db: DbSession) -> AnalyticsSummary:
    return await analytics_service.summary(db, current_user.id)


@router.post(
    "/refresh",
    response_model=AnalyticsSummary,
    summary="Pull live engagement from platforms, then return the fresh summary",
)
async def refresh(current_user: CurrentUser, db: DbSession) -> AnalyticsSummary:
    await analytics_service.refresh_user_analytics(db, current_user.id)
    return await analytics_service.summary(db, current_user.id)


@router.get(
    "/posts/{post_id}",
    response_model=list[AnalyticsRead],
    summary="Analytics snapshots for a post",
)
async def get_post_analytics(
    post_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> list[AnalyticsRead]:
    rows = await analytics_service.list_for_post(db, current_user.id, post_id)
    return [AnalyticsRead.model_validate(r) for r in rows]
