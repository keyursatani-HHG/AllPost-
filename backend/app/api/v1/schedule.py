"""Social account connection and post scheduling endpoints."""
from __future__ import annotations

import math
import uuid

from fastapi import APIRouter, Response, status

from app.api.deps import CurrentUser, DbSession, Pagination
from app.models.enums import ScheduleStatus
from app.schemas.common import Page, PageMeta
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduledPostRead,
    SocialAccountConnect,
    SocialAccountRead,
)
from app.services import schedule_service

router = APIRouter(prefix="/schedule", tags=["Scheduling"])


# --- Social accounts ------------------------------------------------------- #
@router.get("/accounts", response_model=list[SocialAccountRead], summary="List connected accounts")
async def list_accounts(current_user: CurrentUser, db: DbSession) -> list[SocialAccountRead]:
    accounts = await schedule_service.list_social_accounts(db, current_user.id)
    return [SocialAccountRead.model_validate(a) for a in accounts]


@router.post(
    "/accounts",
    response_model=SocialAccountRead,
    status_code=status.HTTP_201_CREATED,
    summary="Connect a social account",
)
async def connect_account(
    data: SocialAccountConnect, current_user: CurrentUser, db: DbSession
) -> SocialAccountRead:
    account = await schedule_service.connect_account(db, current_user, data)
    return SocialAccountRead.model_validate(account)


@router.delete(
    "/accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Disconnect a social account",
)
async def disconnect_account(
    account_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> Response:
    await schedule_service.disconnect_account(db, current_user.id, account_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Scheduling ------------------------------------------------------------ #
@router.get("", response_model=Page[ScheduledPostRead], summary="List scheduled posts")
async def list_scheduled(
    current_user: CurrentUser,
    db: DbSession,
    pagination: Pagination,
    status: ScheduleStatus | None = None,
) -> Page[ScheduledPostRead]:
    items, total = await schedule_service.list_scheduled(
        db, current_user.id, pagination, status
    )
    return Page(
        items=[ScheduledPostRead.model_validate(s) for s in items],
        meta=PageMeta(
            page=pagination.page,
            page_size=pagination.page_size,
            total=total,
            total_pages=math.ceil(total / pagination.page_size) if total else 0,
        ),
    )


@router.post(
    "",
    response_model=list[ScheduledPostRead],
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a post to one or more accounts",
)
async def create_schedule(
    data: ScheduleCreate, current_user: CurrentUser, db: DbSession
) -> list[ScheduledPostRead]:
    created = await schedule_service.create_schedule(db, current_user, data)
    return [ScheduledPostRead.model_validate(s) for s in created]


@router.post(
    "/{scheduled_id}/cancel",
    response_model=ScheduledPostRead,
    summary="Cancel a scheduled post",
)
async def cancel_scheduled(
    scheduled_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> ScheduledPostRead:
    sp = await schedule_service.cancel_scheduled(db, current_user.id, scheduled_id)
    return ScheduledPostRead.model_validate(sp)
