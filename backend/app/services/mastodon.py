"""Mastodon publishing client.

Auth is a personal **access token** (Mastodon → Preferences → Development → New
application → copy the access token) — no OAuth app review needed, just like the
Bluesky app-password flow. Posts text + images or a single video.
"""
from __future__ import annotations

import asyncio
from urllib.parse import urlparse

import httpx

from app.core import errors
from app.core.logging import get_logger

logger = get_logger(__name__)

MAX_TEXT = 500  # default instance character limit


def normalize_instance(url: str) -> str:
    """Turn 'mastodon.social' or 'https://x/' into a clean 'https://x' base URL."""
    url = url.strip().rstrip("/")
    if not url.startswith("http"):
        url = "https://" + url
    return url


def instance_host(url: str) -> str:
    return urlparse(normalize_instance(url)).netloc


async def verify(instance_url: str, token: str) -> dict:
    """Confirm the token and return the account object. Raises on bad credentials."""
    base = normalize_instance(instance_url)
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(
                f"{base}/api/v1/accounts/verify_credentials",
                headers={"Authorization": f"Bearer {token}"},
            )
        except httpx.HTTPError as exc:
            raise errors.bad_request(f"Could not reach {base}: {exc}", "mastodon_unreachable")
    if r.status_code != 200:
        raise errors.bad_request(
            "Mastodon login failed — check the instance URL and access token.",
            "mastodon_auth_failed",
        )
    return r.json()  # { id, username, acct, display_name, avatar, url, ... }


async def _upload_media(
    client: httpx.AsyncClient, base: str, token: str, data: bytes, mime: str, filename: str
) -> str:
    """Upload one media file; wait out async processing (video) until it's ready."""
    r = await client.post(
        f"{base}/api/v2/media",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": (filename, data, mime)},
    )
    if r.status_code not in (200, 202):
        raise errors.bad_request(f"Mastodon media upload failed: {r.text[:150]}", "mastodon_media_failed")
    media = r.json()
    mid = media["id"]
    # 202 (or a null url) means the server is still transcoding — poll until done.
    if r.status_code == 202 or not media.get("url"):
        for _ in range(45):
            await asyncio.sleep(2)
            rp = await client.get(
                f"{base}/api/v1/media/{mid}", headers={"Authorization": f"Bearer {token}"}
            )
            if rp.status_code == 200 and rp.json().get("url"):
                break
    return mid


async def publish(
    instance_url: str,
    token: str,
    text: str,
    images: list[tuple[bytes, str]] | None = None,
    video: tuple[bytes, str] | None = None,
) -> str:
    """Publish a post to Mastodon. Video takes precedence over images. Returns the post URL."""
    base = normalize_instance(instance_url)
    media_ids: list[str] = []
    async with httpx.AsyncClient(timeout=150.0) as client:
        if video:
            data, mime = video
            media_ids.append(await _upload_media(client, base, token, data, mime, "video.mp4"))
        elif images:
            for i, (data, mime) in enumerate(images[:4]):
                ext = "png" if "png" in mime else "jpg"
                media_ids.append(await _upload_media(client, base, token, data, mime, f"image{i}.{ext}"))

        payload: dict = {"status": text[:MAX_TEXT]}
        if media_ids:
            payload["media_ids"] = media_ids
        r = await client.post(
            f"{base}/api/v1/statuses",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
    if r.status_code != 200:
        raise errors.bad_request(f"Mastodon post failed: {r.text[:200]}", "mastodon_post_failed")
    url = r.json()["url"]
    logger.info("Published to Mastodon: %s", url)
    return url
