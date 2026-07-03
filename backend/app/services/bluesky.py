"""Bluesky (AT Protocol) publishing client.

Auth uses an *app password* (Bluesky → Settings → Privacy & Security → App
Passwords) — no OAuth app or review required. Posts text + up to 4 images.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone

import httpx

from app.core import errors
from app.core.logging import get_logger

logger = get_logger(__name__)

XRPC = "https://bsky.social/xrpc"
MAX_TEXT = 300  # Bluesky limit (graphemes; chars is a safe approximation)
MAX_BLOB = 1_000_000  # ~1 MB per image


def _fit_image(data: bytes, mime: str) -> tuple[bytes, str]:
    """Re-encode/downscale an image until it fits Bluesky's blob cap."""
    if len(data) <= MAX_BLOB:
        return data, mime
    try:
        from PIL import Image
    except ImportError:
        raise errors.bad_request(
            "Image is too large for Bluesky (max ~1 MB).", "bluesky_image_too_large"
        )

    img = Image.open(io.BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    quality = 85
    while True:
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=quality, optimize=True)
        if buf.tell() <= MAX_BLOB:
            logger.info(
                "Compressed image for Bluesky: %d -> %d bytes", len(data), buf.tell()
            )
            return buf.getvalue(), "image/jpeg"
        if quality > 50:
            quality -= 10
        elif min(img.size) > 256:
            img = img.resize(
                (int(img.width * 0.8), int(img.height * 0.8)), Image.LANCZOS
            )
        else:
            raise errors.bad_request(
                "Image could not be compressed enough for Bluesky.",
                "bluesky_image_too_large",
            )


async def create_session(identifier: str, app_password: str) -> dict:
    """Log in with handle/email + app password. Raises on bad credentials."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.post(
                f"{XRPC}/com.atproto.server.createSession",
                json={"identifier": identifier.lstrip("@"), "password": app_password},
            )
        except httpx.HTTPError as exc:
            raise errors.bad_request(f"Could not reach Bluesky: {exc}", "bluesky_unreachable")
    if r.status_code != 200:
        raise errors.bad_request(
            "Bluesky login failed — double-check your handle and app password.",
            "bluesky_auth_failed",
        )
    return r.json()  # { accessJwt, refreshJwt, did, handle, ... }


async def publish(
    identifier: str,
    app_password: str,
    text: str,
    images: list[tuple[bytes, str]] | None = None,
) -> str:
    """Publish a post. `images` is a list of (bytes, mime). Returns the post URI."""
    session = await create_session(identifier, app_password)
    jwt = session["accessJwt"]
    did = session["did"]
    auth = {"Authorization": f"Bearer {jwt}"}

    embed = None
    if images:
        uploaded = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for data, mime in images[:4]:
                data, mime = _fit_image(data, mime)
                rb = await client.post(
                    f"{XRPC}/com.atproto.repo.uploadBlob",
                    content=data,
                    headers={**auth, "Content-Type": mime},
                )
                if rb.status_code != 200:
                    raise errors.bad_request("Bluesky image upload failed.", "bluesky_blob_failed")
                uploaded.append({"alt": "", "image": rb.json()["blob"]})
        embed = {"$type": "app.bsky.embed.images", "images": uploaded}

    record: dict = {
        "$type": "app.bsky.feed.post",
        "text": text[:MAX_TEXT],
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    if embed:
        record["embed"] = embed

    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(
            f"{XRPC}/com.atproto.repo.createRecord",
            headers=auth,
            json={"repo": did, "collection": "app.bsky.feed.post", "record": record},
        )
    if r.status_code != 200:
        raise errors.bad_request(f"Bluesky post failed: {r.text[:200]}", "bluesky_post_failed")

    uri = r.json()["uri"]
    logger.info("Published to Bluesky: %s", uri)
    return uri


def post_url(uri: str, handle: str) -> str:
    """at://did/app.bsky.feed.post/<rkey> -> https://bsky.app/profile/<handle>/post/<rkey>"""
    rkey = uri.rsplit("/", 1)[-1]
    return f"https://bsky.app/profile/{handle}/post/{rkey}"
