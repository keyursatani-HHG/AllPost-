"""Reusable FastAPI dependencies: DB session, current user, RBAC, pagination."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.core.security import ACCESS, decode_token
from app.db.session import get_db
from app.models.enums import RoleName
from app.models.user import User
from app.schemas.common import PaginationParams
from app.services import user_service

bearer_scheme = HTTPBearer(auto_error=False, description="JWT access token")

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None:
        raise errors.unauthorized()
    try:
        payload = decode_token(credentials.credentials, ACCESS)
    except JWTError:
        raise errors.unauthorized("Invalid or expired token", "invalid_token")

    user = await user_service.get_by_id(db, payload.get("sub", ""))
    if user is None or not user.is_active:
        raise errors.unauthorized("Account unavailable", "inactive_account")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: RoleName):
    """Dependency factory enforcing that the current user has one of `roles`."""
    allowed = {r.value for r in roles}

    async def _checker(user: CurrentUser) -> User:
        if user.role.name.value not in allowed:
            raise errors.forbidden()
        return user

    return _checker


def get_pagination(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def get_client_meta(request: Request) -> dict[str, str | None]:
    ip = request.client.host if request.client else None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    return {"user_agent": request.headers.get("user-agent"), "ip_address": ip}


ClientMeta = Annotated[dict, Depends(get_client_meta)]
