"""Content Studio endpoints — server-side video generation.

Currently: 2x2 grid video (4 images -> short MP4). Output is written to the same
/uploads store as media and can be posted like any other uploaded file.
"""
from __future__ import annotations

import pathlib
import uuid

from fastapi import APIRouter, File, UploadFile

from app.api.deps import CurrentUser
from app.core import errors
from app.services import video

router = APIRouter(prefix="/studio", tags=["Studio"])

UPLOAD_DIR = pathlib.Path("uploads")
ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 15 * 1024 * 1024  # 15 MB per source image


@router.post("/grid-video", summary="Generate a 2x2 grid video from 4 images")
async def grid_video(
    current_user: CurrentUser,
    files: list[UploadFile] = File(..., description="Exactly 4 images"),
) -> dict:
    if len(files) != 4:
        raise errors.bad_request("Please provide exactly 4 images.", "need_four_images")

    images: list[bytes] = []
    for f in files:
        if f.content_type not in ALLOWED_IMAGE:
            raise errors.bad_request(
                f"Unsupported image type: {f.content_type}", "bad_file_type"
            )
        data = await f.read()
        if len(data) > MAX_BYTES:
            raise errors.bad_request("An image is too large (max 15 MB).", "file_too_large")
        images.append(data)

    UPLOAD_DIR.mkdir(exist_ok=True)
    name = f"{uuid.uuid4().hex}.mp4"
    out_path = UPLOAD_DIR / name
    video.make_grid_video(images, str(out_path))

    return {
        "url": f"/uploads/{name}",
        "filename": name,
        "content_type": "video/mp4",
        "size": out_path.stat().st_size,
    }


@router.post("/fade-video", summary="Generate a fade-in video from a single image")
async def fade_video(
    current_user: CurrentUser,
    file: UploadFile = File(..., description="A single image"),
) -> dict:
    if file.content_type not in ALLOWED_IMAGE:
        raise errors.bad_request(f"Unsupported image type: {file.content_type}", "bad_file_type")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise errors.bad_request("Image is too large (max 15 MB).", "file_too_large")

    UPLOAD_DIR.mkdir(exist_ok=True)
    name = f"{uuid.uuid4().hex}.mp4"
    out_path = UPLOAD_DIR / name
    video.make_fade_video(data, str(out_path))

    return {
        "url": f"/uploads/{name}",
        "filename": name,
        "content_type": "video/mp4",
        "size": out_path.stat().st_size,
    }
