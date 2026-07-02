"""Authentication endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import RedirectResponse
from jose import JWTError

from app.api.deps import ClientMeta, CurrentUser, DbSession
from app.api.rate_limit import rate_limit
from app.core.config import settings
from app.core import errors
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenBundle,
)
from app.schemas.common import Message
from app.schemas.user import UserRead
from app.services import auth_service, oauth_service

OAUTH_STATE_COOKIE = "postly_oauth_state"


def _safe_next(next_path: str | None) -> str:
    """Only allow local, single-slash redirect paths (open-redirect guard)."""
    if next_path and next_path.startswith("/") and not next_path.startswith("//"):
        return next_path
    return "/dashboard"

router = APIRouter(prefix="/auth", tags=["Authentication"])

_auth_limit = Depends(rate_limit(settings.AUTH_RATE_LIMIT_PER_MINUTE, "auth"))


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.refresh_token_expire_seconds,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN or None,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        domain=settings.COOKIE_DOMAIN or None,
        path="/",
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[_auth_limit],
    summary="Create a new account",
)
async def register(
    data: RegisterRequest, response: Response, db: DbSession, meta: ClientMeta
) -> AuthResponse:
    user = await auth_service.register(db, data)
    tokens = await auth_service.issue_tokens(db, user, **meta)
    _set_refresh_cookie(response, tokens.refresh_token)
    return AuthResponse(user=UserRead.from_model(user), tokens=tokens)


@router.post(
    "/login",
    response_model=AuthResponse,
    dependencies=[_auth_limit],
    summary="Log in with email and password",
)
async def login(
    data: LoginRequest, response: Response, db: DbSession, meta: ClientMeta
) -> AuthResponse:
    user = await auth_service.authenticate(db, data.email, data.password)
    tokens = await auth_service.issue_tokens(db, user, **meta)
    _set_refresh_cookie(response, tokens.refresh_token)
    return AuthResponse(user=UserRead.from_model(user), tokens=tokens)


@router.post(
    "/refresh",
    response_model=TokenBundle,
    dependencies=[_auth_limit],
    summary="Exchange the refresh cookie for a new access token",
)
async def refresh(
    request: Request, response: Response, db: DbSession, meta: ClientMeta
) -> TokenBundle:
    token = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    if not token:
        raise errors.unauthorized("No active session", "no_session")
    tokens = await auth_service.rotate_refresh_token(db, token, **meta)
    _set_refresh_cookie(response, tokens.refresh_token)
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Log out")
async def logout(request: Request, response: Response, db: DbSession) -> Response:
    token = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    await auth_service.revoke_refresh_token(db, token)
    _clear_refresh_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserRead, summary="Get the current user")
async def me(current_user: CurrentUser) -> UserRead:
    return UserRead.from_model(current_user)


@router.post(
    "/forgot-password",
    response_model=Message,
    dependencies=[_auth_limit],
    summary="Request a password reset link",
)
async def forgot_password(data: ForgotPasswordRequest, db: DbSession) -> Message:
    await auth_service.request_password_reset(db, data.email)
    # Always the same response to prevent account enumeration.
    return Message(message="If that email exists, a reset link has been sent.")


@router.post(
    "/reset-password",
    response_model=Message,
    dependencies=[_auth_limit],
    summary="Reset password using a token",
)
async def reset_password(data: ResetPasswordRequest, db: DbSession) -> Message:
    await auth_service.reset_password(db, data.token, data.password)
    return Message(message="Your password has been reset. You can now sign in.")


# --------------------------------------------------------------------------- #
# Google OAuth (Authorization Code flow)
# --------------------------------------------------------------------------- #
@router.get(
    "/google/login",
    include_in_schema=True,
    summary="Begin Google sign-in (redirects to Google)",
)
async def google_login(next: str = "/dashboard") -> RedirectResponse:
    if not settings.google_oauth_enabled:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_unavailable")

    nonce, state_token = oauth_service.make_state(_safe_next(next))
    response = RedirectResponse(oauth_service.google_auth_url(nonce))
    response.set_cookie(
        OAUTH_STATE_COOKIE,
        state_token,
        max_age=600,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return response


@router.get(
    "/google/callback",
    include_in_schema=True,
    summary="Google OAuth callback",
)
async def google_callback(
    request: Request,
    db: DbSession,
    meta: ClientMeta,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    login_url = f"{settings.FRONTEND_URL}/login"

    if error or not code or not state:
        return RedirectResponse(f"{login_url}?error=google_failed")

    # Validate CSRF state from the signed cookie.
    state_cookie = request.cookies.get(OAUTH_STATE_COOKIE)
    try:
        st = oauth_service.read_state(state_cookie) if state_cookie else None
    except (JWTError, ValueError):
        st = None
    if not st or st.get("nonce") != state:
        return RedirectResponse(f"{login_url}?error=google_state")

    try:
        info = await oauth_service.fetch_google_user(code)
    except Exception:  # noqa: BLE001 - upstream/network failure
        return RedirectResponse(f"{login_url}?error=google_failed")

    email = info.get("email")
    if not email or not info.get("email_verified", False):
        return RedirectResponse(f"{login_url}?error=google_email")

    user = await auth_service.upsert_oauth_user(
        db, email=email, name=info.get("name"), avatar_url=info.get("picture")
    )
    tokens = await auth_service.issue_tokens(db, user, **meta)

    response = RedirectResponse(f"{settings.FRONTEND_URL}{_safe_next(st.get('next'))}")
    _set_refresh_cookie(response, tokens.refresh_token)
    response.delete_cookie(OAUTH_STATE_COOKIE, path="/")
    return response
