"""LinkedIn OAuth 2.0 + posting.

Connecting a LinkedIn account uses the Authorization Code flow (the user is sent
to LinkedIn to approve), because LinkedIn has no token-paste option. Requires a
LinkedIn developer app with the "Sign In with LinkedIn using OpenID Connect" and
"Share on LinkedIn" products; credentials come from env vars.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from jose import jwt

from app.core import errors
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
UGC_POSTS_URL = "https://api.linkedin.com/v2/ugcPosts"
REGISTER_UPLOAD_URL = "https://api.linkedin.com/v2/assets?action=registerUpload"
SCOPES = "openid profile w_member_social"
MAX_TEXT = 3000
MAX_IMAGES = 9

_STATE_TYPE = "linkedin_state"


def make_state(user_id: str) -> tuple[str, str]:
    """(nonce sent to LinkedIn, signed cookie token carrying user_id + nonce)."""
    nonce = secrets.token_urlsafe(16)
    token = jwt.encode(
        {
            "nonce": nonce,
            "uid": user_id,
            "type": _STATE_TYPE,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return nonce, token


def read_state(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != _STATE_TYPE:
        raise ValueError("wrong token type")
    return payload


def auth_url(nonce: str) -> str:
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "state": nonce,
        "scope": SCOPES,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> str:
    """Swap an auth code for an access token."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    r.raise_for_status()
    return r.json()["access_token"]


async def fetch_userinfo(access_token: str) -> dict[str, Any]:
    """Return the member profile ({sub, name, picture, ...}); sub is the member id."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()
    return r.json()


async def _upload_image(
    client: httpx.AsyncClient, access_token: str, author_urn: str, data: bytes
) -> str:
    """Register + upload one image; return its digitalmediaAsset URN."""
    auth = {"Authorization": f"Bearer {access_token}"}
    reg = await client.post(
        REGISTER_UPLOAD_URL,
        headers={**auth, "X-Restli-Protocol-Version": "2.0.0", "Content-Type": "application/json"},
        json={
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": author_urn,
                "serviceRelationships": [
                    {"relationshipType": "OWNER", "identifier": "urn:li:userGeneratedContent"}
                ],
            }
        },
    )
    if reg.status_code not in (200, 201):
        raise errors.bad_request(f"LinkedIn image register failed: {reg.text[:200]}", "linkedin_image_failed")
    value = reg.json()["value"]
    asset = value["asset"]
    upload_url = value["uploadMechanism"][
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]["uploadUrl"]

    put = await client.put(upload_url, headers=auth, content=data)
    if put.status_code not in (200, 201):
        raise errors.bad_request(
            f"LinkedIn image upload failed: {put.status_code}", "linkedin_image_failed"
        )
    return asset


async def publish(
    access_token: str,
    author_sub: str,
    text: str,
    images: list[tuple[bytes, str]] | None = None,
) -> str:
    """Publish a post (text + optional images) as the member. Returns the post URL."""
    author = f"urn:li:person:{author_sub}"
    async with httpx.AsyncClient(timeout=90.0) as client:
        media = []
        if images:
            for data, _mime in images[:MAX_IMAGES]:
                asset = await _upload_image(client, access_token, author, data)
                media.append({"status": "READY", "media": asset})

        share: dict = {
            "shareCommentary": {"text": text[:MAX_TEXT]},
            "shareMediaCategory": "IMAGE" if media else "NONE",
        }
        if media:
            share["media"] = media

        body = {
            "author": author,
            "lifecycleState": "PUBLISHED",
            "specificContent": {"com.linkedin.ugc.ShareContent": share},
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }
        r = await client.post(
            UGC_POSTS_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json",
            },
            json=body,
        )
    if r.status_code not in (200, 201):
        raise errors.bad_request(f"LinkedIn post failed: {r.text[:200]}", "linkedin_post_failed")
    urn = r.headers.get("x-restli-id") or r.json().get("id", "")
    logger.info("Published to LinkedIn: %s", urn)
    return f"https://www.linkedin.com/feed/update/{urn}" if urn else "https://www.linkedin.com/feed/"
