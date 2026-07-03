"""Media upload endpoint. Stores files locally and serves them from /uploads.

NOTE: local disk is fine for dev; on ephemeral hosts (Render free tier) use S3
for durable storage — swap the write below for an S3 put + presigned URL.
"""
from __future__ import annotations

import pathlib
import uuid

from fastapi import APIRouter, File, UploadFile

from app.api.deps import CurrentUser
from app.core import errors

router = APIRouter(prefix="/media", tags=["Media"])

UPLOAD_DIR = pathlib.Path("uploads")
ALLOWED = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/quicktime", "application/pdf",
}
MAX_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post("/upload", summary="Upload an image/video/PDF")
async def upload_media(current_user: CurrentUser, file: UploadFile = File(...)) -> dict:
    if file.content_type not in ALLOWED:
        raise errors.bad_request(f"Unsupported file type: {file.content_type}", "bad_file_type")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise errors.bad_request("File too large (max 25 MB)", "file_too_large")

    UPLOAD_DIR.mkdir(exist_ok=True)
    ext = pathlib.Path(file.filename or "").suffix.lower()[:10]
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)

    # Relative URL; the frontend prefixes it with the API origin.
    return {
        "url": f"/uploads/{name}",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(data),
    }
