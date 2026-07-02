"""Google OAuth 2.0 (Authorization Code flow) helpers.

Pure Google/HTTP concerns — user upsert lives in ``auth_service``.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from jose import jwt

from app.core.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

_STATE_TYPE = "oauth_state"


def make_state(next_path: str) -> tuple[str, str]:
    """Return (nonce, signed_state_token). The nonce goes to Google; the signed
    token (carrying the nonce + post-login redirect) is stored in a cookie."""
    nonce = secrets.token_urlsafe(16)
    token = jwt.encode(
        {
            "nonce": nonce,
            "next": next_path,
            "type": _STATE_TYPE,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return nonce, token


def read_state(token: str) -> dict[str, Any]:
    """Decode the state cookie; raises jose.JWTError if invalid/expired."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != _STATE_TYPE:
        raise ValueError("wrong token type")
    return payload


def google_auth_url(nonce: str) -> str:
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": nonce,
        "access_type": "offline",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def fetch_google_user(code: str) -> dict[str, Any]:
    """Exchange an auth code for tokens and return the Google userinfo profile."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        token_res.raise_for_status()
        access_token = token_res.json()["access_token"]

        info_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info_res.raise_for_status()
        return info_res.json()
