"""Password hashing and JWT token utilities."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# Token type constants
ACCESS = "access"
REFRESH = "refresh"
RESET = "reset"


# --------------------------------------------------------------------------- #
# Passwords  (bcrypt directly — avoids passlib/bcrypt version coupling)
# --------------------------------------------------------------------------- #
def _to_bytes(password: str) -> bytes:
    # bcrypt only uses the first 72 bytes; truncate explicitly so long inputs
    # (and multi-byte characters) never raise.
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_to_bytes(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# --------------------------------------------------------------------------- #
# JWT
# --------------------------------------------------------------------------- #
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(payload: dict[str, Any]) -> str:
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str, role: str, extra: dict[str, Any] | None = None) -> str:
    now = _now()
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": ACCESS,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": uuid.uuid4().hex,
    }
    if extra:
        payload.update(extra)
    return _encode(payload)


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    """Returns (token, jti, expires_at)."""
    now = _now()
    jti = uuid.uuid4().hex
    expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token = _encode(
        {"sub": str(subject), "type": REFRESH, "iat": now, "exp": expires, "jti": jti}
    )
    return token, jti, expires


def create_reset_token(email: str) -> str:
    now = _now()
    return _encode(
        {
            "sub": email,
            "type": RESET,
            "iat": now,
            "exp": now + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
            "jti": uuid.uuid4().hex,
        }
    )


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError on any problem."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if expected_type and payload.get("type") != expected_type:
        raise JWTError(f"Expected token type '{expected_type}'")
    return payload
