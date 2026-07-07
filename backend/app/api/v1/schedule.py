"""Social account connection and post scheduling endpoints."""
from __future__ import annotations

import math
import uuid
from datetime import date, datetime

from fastapi import APIRouter, Request, Response, status
from fastapi.responses import RedirectResponse
from jose import JWTError

import httpx

from app.api.deps import CurrentUser, DbSession, Pagination
from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import REFRESH, decode_token
from app.models.enums import ScheduleStatus

logger = get_logger(__name__)
from app.schemas.common import Page, PageMeta
from app.schemas.schedule import (
    BlueskyConnect,
    CalendarItem,
    CalendarNoteRead,
    CalendarNoteWrite,
    MastodonConnect,
    PublishRequest,
    PublishResponse,
    ScheduleCreate,
    ScheduledPostRead,
    SocialAccountConnect,
    SocialAccountRead,
)
from app.services import linkedin, schedule_service

router = APIRouter(prefix="/schedule", tags=["Scheduling"])

LINKEDIN_STATE_COOKIE = "postly_linkedin_state"


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


@router.post(
    "/accounts/bluesky",
    response_model=SocialAccountRead,
    status_code=status.HTTP_201_CREATED,
    summary="Connect a Bluesky account (handle + app password)",
)
async def connect_bluesky(
    data: BlueskyConnect, current_user: CurrentUser, db: DbSession
) -> SocialAccountRead:
    account = await schedule_service.connect_bluesky(
        db, current_user, data.identifier, data.app_password
    )
    return SocialAccountRead.model_validate(account)


@router.post(
    "/accounts/mastodon",
    response_model=SocialAccountRead,
    status_code=status.HTTP_201_CREATED,
    summary="Connect a Mastodon account (instance URL + access token)",
)
async def connect_mastodon(
    data: MastodonConnect, current_user: CurrentUser, db: DbSession
) -> SocialAccountRead:
    account = await schedule_service.connect_mastodon(
        db, current_user, data.instance_url, data.access_token
    )
    return SocialAccountRead.model_validate(account)


# --- LinkedIn OAuth (browser redirect flow) -------------------------------- #
@router.get(
    "/accounts/linkedin/login",
    summary="Begin connecting a LinkedIn account (redirects to LinkedIn)",
)
async def linkedin_login(request: Request) -> RedirectResponse:
    dash = f"{settings.FRONTEND_URL}/dashboard"
    if not settings.linkedin_oauth_enabled:
        return RedirectResponse(f"{dash}?linkedin=not_configured")
    # Identify the logged-in user from the refresh cookie (a full-page nav carries it).
    refresh = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    try:
        payload = decode_token(refresh, REFRESH) if refresh else None
    except JWTError:
        payload = None
    if not payload or not payload.get("sub"):
        return RedirectResponse(f"{dash}?linkedin=auth_required")

    nonce, state_token = linkedin.make_state(str(payload["sub"]))
    resp = RedirectResponse(linkedin.auth_url(nonce))
    resp.set_cookie(
        LINKEDIN_STATE_COOKIE, state_token, max_age=600, httponly=True,
        secure=settings.COOKIE_SECURE, samesite=settings.COOKIE_SAMESITE, path="/",
    )
    return resp


@router.get(
    "/accounts/linkedin/callback",
    summary="LinkedIn OAuth callback",
)
async def linkedin_callback(
    request: Request,
    db: DbSession,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
) -> RedirectResponse:
    dash = f"{settings.FRONTEND_URL}/dashboard"
    if error or not code or not state:
        logger.warning("LinkedIn callback returned error=%s desc=%s", error, error_description)
        return RedirectResponse(f"{dash}?linkedin=failed")

    state_cookie = request.cookies.get(LINKEDIN_STATE_COOKIE)
    try:
        st = linkedin.read_state(state_cookie) if state_cookie else None
    except (JWTError, ValueError):
        st = None
    if not st or st.get("nonce") != state:
        logger.warning("LinkedIn callback state mismatch")
        return RedirectResponse(f"{dash}?linkedin=state")

    try:
        token = await linkedin.exchange_code(code)
        info = await linkedin.fetch_userinfo(token)
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "LinkedIn token/userinfo failed: %s %s",
            exc.response.status_code, exc.response.text[:400],
        )
        return RedirectResponse(f"{dash}?linkedin=failed")
    except Exception as exc:  # noqa: BLE001 - upstream/network failure
        logger.warning("LinkedIn connect failed: %r", exc)
        return RedirectResponse(f"{dash}?linkedin=failed")

    sub = info.get("sub")
    if not sub:
        logger.warning("LinkedIn userinfo missing sub: %s", info)
        return RedirectResponse(f"{dash}?linkedin=failed")

    await schedule_service.connect_linkedin(
        db, uuid.UUID(str(st["uid"])), sub, info.get("name") or "LinkedIn", token, info.get("picture")
    )
    resp = RedirectResponse(f"{dash}?linkedin=connected")
    resp.delete_cookie(LINKEDIN_STATE_COOKIE, path="/")
    return resp


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
@router.get(
    "/calendar",
    response_model=list[CalendarItem],
    summary="Scheduled/published items in a date range (for the calendar)",
)
async def calendar(
    current_user: CurrentUser,
    db: DbSession,
    start: datetime,
    end: datetime,
) -> list[CalendarItem]:
    rows = await schedule_service.calendar_items(db, current_user.id, start, end)
    return [CalendarItem.model_validate(r) for r in rows]


@router.get(
    "/notes",
    response_model=list[CalendarNoteRead],
    summary="Calendar notes in a date range",
)
async def list_notes(
    current_user: CurrentUser, db: DbSession, start: date, end: date
) -> list[CalendarNoteRead]:
    notes = await schedule_service.list_notes(db, current_user.id, start, end)
    return [CalendarNoteRead.model_validate(n) for n in notes]


@router.put(
    "/notes",
    response_model=CalendarNoteRead,
    summary="Create or update the note for a day",
)
async def upsert_note(
    data: CalendarNoteWrite, current_user: CurrentUser, db: DbSession
) -> CalendarNoteRead:
    note = await schedule_service.upsert_note(
        db, current_user.id, data.note_date, data.content
    )
    return CalendarNoteRead.model_validate(note)


@router.delete(
    "/notes/{note_date}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete the note for a day",
)
async def delete_note(
    note_date: date, current_user: CurrentUser, db: DbSession
) -> Response:
    await schedule_service.delete_note(db, current_user.id, note_date)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    "/publish",
    response_model=PublishResponse,
    summary="Publish a post now to selected accounts (real send for Bluesky)",
)
async def publish_now(
    data: PublishRequest, current_user: CurrentUser, db: DbSession
) -> PublishResponse:
    results = await schedule_service.publish_now(
        db, current_user, data.post_id, data.social_account_ids
    )
    return PublishResponse(results=results)


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
