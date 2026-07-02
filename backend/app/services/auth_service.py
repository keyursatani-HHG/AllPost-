"""Authentication flows: register, login, refresh rotation, logout, reset."""
from __future__ import annotations

import secrets
from datetime import datetime, timezone

from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import (
    ACCESS,
    REFRESH,
    RESET,
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import RoleName
from app.models.refresh_token import RefreshToken
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenBundle
from app.services import user_service

logger = get_logger(__name__)

# Precomputed hash used to keep failed logins ~constant time (anti-enumeration).
_DUMMY_PASSWORD_HASH = hash_password("timing-attack-mitigation-dummy")


async def _get_role(db: AsyncSession, name: RoleName) -> Role:
    result = await db.execute(select(Role).where(Role.name == name))
    role = result.scalar_one_or_none()
    if role is None:
        # Self-heal if roles weren't seeded yet.
        role = Role(name=name, description=f"{name.value} role")
        db.add(role)
        await db.flush()
    return role


async def register(db: AsyncSession, data: RegisterRequest) -> User:
    existing = await user_service.get_by_email(db, data.email)
    if existing is not None:
        raise errors.conflict("An account with this email already exists", "email_taken")

    role = await _get_role(db, RoleName.owner)
    user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        phone=data.phone,
        company=data.company,
        role_id=role.id,
    )
    user.role = role  # make role available for serialization without a re-query
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def upsert_oauth_user(
    db: AsyncSession, *, email: str, name: str | None, avatar_url: str | None
) -> User:
    """Find-or-create a user from a verified OAuth identity (matched by email).

    Existing accounts are linked (marked verified, avatar backfilled). New
    accounts get a random unusable password — the user can set one later via
    the reset-password flow if they also want email/password sign-in.
    """
    user = await user_service.get_by_email(db, email)
    if user is not None:
        changed = False
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
            changed = True
        if not user.is_verified:
            user.is_verified = True
            changed = True
        if changed:
            await db.commit()
            await db.refresh(user)
        return user

    role = await _get_role(db, RoleName.owner)
    user = User(
        name=(name or email.split("@")[0])[:120],
        email=email.lower(),
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        avatar_url=avatar_url,
        is_verified=True,
        role_id=role.id,
    )
    user.role = role
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await user_service.get_by_email(db, email)
    # Constant-ish time: always run a hash comparison to reduce user enumeration.
    if user is None:
        verify_password(password, _DUMMY_PASSWORD_HASH)
        raise errors.unauthorized("Incorrect email or password", "invalid_credentials")
    if not verify_password(password, user.hashed_password):
        raise errors.unauthorized("Incorrect email or password", "invalid_credentials")
    if not user.is_active:
        raise errors.unauthorized("This account has been deactivated", "inactive_account")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    return user


async def issue_tokens(
    db: AsyncSession,
    user: User,
    *,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> TokenBundle:
    access = create_access_token(str(user.id), user.role.name.value)
    refresh, jti, expires = create_refresh_token(str(user.id))

    db.add(
        RefreshToken(
            user_id=user.id,
            jti=jti,
            expires_at=expires,
            user_agent=(user_agent or "")[:400] or None,
            ip_address=ip_address,
        )
    )
    await db.commit()

    return TokenBundle(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.access_token_expire_seconds,
    )


async def rotate_refresh_token(
    db: AsyncSession,
    token: str,
    *,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> TokenBundle:
    try:
        payload = decode_token(token, REFRESH)
    except JWTError:
        raise errors.unauthorized("Invalid or expired session", "invalid_refresh")

    jti = payload.get("jti")
    result = await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    stored = result.scalar_one_or_none()

    if stored is None or stored.revoked:
        raise errors.unauthorized("Session is no longer valid", "invalid_refresh")
    # Normalise to aware UTC — some drivers (e.g. SQLite) return naive datetimes.
    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise errors.unauthorized("Session has expired", "expired_refresh")

    user = await user_service.get_by_id(db, payload["sub"])
    if user is None or not user.is_active:
        raise errors.unauthorized("Account unavailable", "inactive_account")

    # Rotate: revoke the old token, issue a fresh pair.
    stored.revoked = True
    await db.flush()
    return await issue_tokens(db, user, user_agent=user_agent, ip_address=ip_address)


async def revoke_refresh_token(db: AsyncSession, token: str | None) -> None:
    if not token:
        return
    try:
        payload = decode_token(token, REFRESH)
    except JWTError:
        return
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.jti == payload.get("jti"))
    )
    stored = result.scalar_one_or_none()
    if stored is not None:
        stored.revoked = True
        await db.commit()


async def request_password_reset(db: AsyncSession, email: str) -> None:
    """Generate a reset token. Never reveals whether the email exists."""
    user = await user_service.get_by_email(db, email)
    if user is None:
        return
    token = create_reset_token(user.email)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    # TODO: send via email provider. For now, log it (dev-friendly).
    logger.info("Password reset link for %s: %s", user.email, reset_link)


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    try:
        payload = decode_token(token, RESET)
    except JWTError:
        raise errors.bad_request("Invalid or expired reset link", "invalid_reset_token")

    user = await user_service.get_by_email(db, payload["sub"])
    if user is None:
        raise errors.bad_request("Invalid or expired reset link", "invalid_reset_token")

    user.hashed_password = hash_password(new_password)
    # Revoke all sessions on password change.
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user.id, RefreshToken.revoked.is_(False)
        )
    )
    for rt in result.scalars().all():
        rt.revoked = True
    await db.commit()
