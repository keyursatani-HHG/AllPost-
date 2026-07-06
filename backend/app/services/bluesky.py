"""Bluesky (AT Protocol) publishing client.

Auth uses an *app password* (Bluesky → Settings → Privacy & Security → App
Passwords) — no OAuth app or review required. Posts text + up to 4 images.
"""
from __future__ import annotations

import asyncio
import io
import time
from datetime import datetime, timezone

import httpx

from app.core import errors
from app.core.logging import get_logger

logger = get_logger(__name__)

XRPC = "https://bsky.social/xrpc"
VIDEO_XRPC = "https://video.bsky.app/xrpc"
VIDEO_DID = "did:web:video.bsky.app"
MAX_TEXT = 300  # Bluesky limit (graphemes; chars is a safe approximation)
MAX_BLOB = 1_000_000  # ~1 MB per image
MAX_VIDEO_BYTES = 50 * 1024 * 1024  # Bluesky caps video at ~50 MB / 60s
VIDEO_JOB_TIMEOUT_S = 120  # how long to wait for async encoding


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


def _pds_url(session: dict) -> str:
    """Resolve the account's PDS endpoint from the session's DID document."""
    for svc in (session.get("didDoc") or {}).get("service", []):
        if str(svc.get("id", "")).endswith("atproto_pds"):
            return str(svc["serviceEndpoint"]).rstrip("/")
    return "https://bsky.social"


async def _service_token(client: httpx.AsyncClient, pds: str, jwt: str, aud: str, lxm: str) -> str:
    """Fetch a short-lived service-auth token scoped to (aud, lxm)."""
    r = await client.get(
        f"{pds}/xrpc/com.atproto.server.getServiceAuth",
        params={"aud": aud, "lxm": lxm, "exp": int(time.time()) + 1500},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    if r.status_code != 200:
        raise errors.bad_request("Bluesky video auth failed.", "bluesky_video_auth")
    return r.json()["token"]


def _video_error(body: dict) -> None:
    """Raise a friendly error for known video-upload rejections."""
    err = str(body.get("error") or "")
    if err == "unconfirmed_email":
        raise errors.bad_request(
            "Confirm your email address in Bluesky settings to post videos.",
            "bluesky_unconfirmed_email",
        )
    if body.get("canUpload") is False or err:
        raise errors.bad_request(
            f"Bluesky won't accept this video: {body.get('message') or err or 'upload not allowed'}",
            "bluesky_video_rejected",
        )


async def _upload_video(
    client: httpx.AsyncClient, pds: str, did: str, jwt: str, data: bytes
) -> dict:
    """Upload a video through Bluesky's video service and return its blob ref."""
    if len(data) > MAX_VIDEO_BYTES:
        raise errors.bad_request("Video is too large for Bluesky (max ~50 MB).", "bluesky_video_too_large")

    pds_did = f"did:web:{pds.split('://', 1)[-1]}"

    # Pre-flight: does this account's plan/state allow uploads? (surfaces unconfirmed_email early)
    limit_tok = await _service_token(client, pds, jwt, VIDEO_DID, "app.bsky.video.getUploadLimits")
    rl = await client.get(
        f"{VIDEO_XRPC}/app.bsky.video.getUploadLimits",
        headers={"Authorization": f"Bearer {limit_tok}"},
    )
    if rl.status_code != 200 or rl.json().get("canUpload") is False:
        _video_error(rl.json())

    # Upload: aud must be the PDS DID and lxm must be com.atproto.repo.uploadBlob (Bluesky quirk).
    up_tok = await _service_token(client, pds, jwt, pds_did, "com.atproto.repo.uploadBlob")
    ru = await client.post(
        f"{VIDEO_XRPC}/app.bsky.video.uploadVideo",
        params={"did": did, "name": f"postly-{int(time.time())}.mp4"},
        headers={"Authorization": f"Bearer {up_tok}", "Content-Type": "video/mp4"},
        content=data,
    )
    body = ru.json() if ru.headers.get("content-type", "").startswith("application/json") else {}
    job = body.get("jobStatus", body)
    if ru.status_code not in (200, 201):
        _video_error(job if isinstance(job, dict) else body)
        raise errors.bad_request(f"Bluesky video upload failed: {ru.text[:150]}", "bluesky_video_failed")

    blob = job.get("blob")
    job_id = job.get("jobId")

    # Poll the (public) job status until encoding completes.
    deadline = time.time() + VIDEO_JOB_TIMEOUT_S
    while not blob and time.time() < deadline:
        await asyncio.sleep(2)
        rj = await client.get(f"{VIDEO_XRPC}/app.bsky.video.getJobStatus", params={"jobId": job_id})
        js = rj.json().get("jobStatus", {}) if rj.status_code == 200 else {}
        state = js.get("state")
        if state == "JOB_STATE_COMPLETED":
            blob = js.get("blob")
            break
        if state == "JOB_STATE_FAILED":
            raise errors.bad_request(
                f"Bluesky couldn't process the video: {js.get('error') or 'encoding failed'}",
                "bluesky_video_encode_failed",
            )
    if not blob:
        raise errors.bad_request("Bluesky video processing timed out.", "bluesky_video_timeout")
    return blob


async def publish(
    identifier: str,
    app_password: str,
    text: str,
    images: list[tuple[bytes, str]] | None = None,
    video: tuple[bytes, str] | None = None,
    aspect_ratio: tuple[int, int] | None = None,
) -> str:
    """Publish a post. `images` is (bytes, mime) list; `video` is a single (bytes, mime).

    Video takes precedence over images (Bluesky can't embed both). Returns the post URI.
    """
    session = await create_session(identifier, app_password)
    jwt = session["accessJwt"]
    did = session["did"]
    auth = {"Authorization": f"Bearer {jwt}"}

    embed = None
    if video:
        data, _mime = video
        async with httpx.AsyncClient(timeout=float(VIDEO_JOB_TIMEOUT_S + 30)) as client:
            blob = await _upload_video(client, _pds_url(session), did, jwt, data)
        embed = {"$type": "app.bsky.embed.video", "video": blob}
        if aspect_ratio:
            embed["aspectRatio"] = {"width": aspect_ratio[0], "height": aspect_ratio[1]}
    elif images:
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


PUBLIC_APPVIEW = "https://public.api.bsky.app/xrpc"


async def fetch_post_stats(uris: list[str]) -> dict[str, dict]:
    """Fetch engagement counts for post URIs from Bluesky's public AppView.

    No auth needed (public read). Returns {uri: {likes, comments, shares}}.
    Bluesky does not expose impressions/views, so those aren't available.
    """
    stats: dict[str, dict] = {}
    if not uris:
        return stats
    async with httpx.AsyncClient(timeout=20.0) as client:
        for i in range(0, len(uris), 25):  # getPosts accepts up to 25 URIs
            batch = uris[i : i + 25]
            try:
                r = await client.get(
                    f"{PUBLIC_APPVIEW}/app.bsky.feed.getPosts", params={"uris": batch}
                )
            except httpx.HTTPError as exc:
                logger.warning("Bluesky stats fetch failed: %s", exc)
                continue
            if r.status_code != 200:
                logger.warning("Bluesky getPosts %s: %s", r.status_code, r.text[:150])
                continue
            for p in r.json().get("posts", []):
                stats[p["uri"]] = {
                    "likes": int(p.get("likeCount", 0)),
                    "comments": int(p.get("replyCount", 0)),
                    "shares": int(p.get("repostCount", 0)) + int(p.get("quoteCount", 0)),
                }
    return stats
