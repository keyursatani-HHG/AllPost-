"""Content Studio video generation.

Composites images into a 2x2 grid and encodes a short MP4. Uses Pillow for the
frame layout and imageio's bundled FFmpeg binary (imageio-ffmpeg) for H.264
encoding, so no system FFmpeg install is required.
"""
from __future__ import annotations

import io

from app.core import errors
from app.core.logging import get_logger

logger = get_logger(__name__)

CANVAS = 1080          # square output, 1080x1080 (social standard)
FPS = 24
DURATION_S = 4         # total clip length
FADE_FRAMES = 12       # fade-in from black over the first ~0.5s
GAP = 8                # px gutter between tiles


def _cover(img, size: int):
    """Resize+center-crop an image to exactly (size, size) — 'cover' fit."""
    from PIL import Image

    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    w, h = img.size
    scale = max(size / w, size / h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - size) // 2
    top = (nh - size) // 2
    return img.crop((left, top, left + size, top + size))


def _build_grid(images: list[bytes]):
    """Return a Pillow Image: the 4 inputs laid out as a 2x2 grid on a canvas."""
    from PIL import Image

    tile = (CANVAS - 3 * GAP) // 2  # gutters: outer edges + center
    canvas = Image.new("RGB", (CANVAS, CANVAS), (17, 24, 39))  # slate-900 backdrop
    # top-left, top-right, bottom-left, bottom-right
    positions = [
        (GAP, GAP),
        (GAP * 2 + tile, GAP),
        (GAP, GAP * 2 + tile),
        (GAP * 2 + tile, GAP * 2 + tile),
    ]
    for data, pos in zip(images, positions):
        try:
            tile_img = _cover(Image.open(io.BytesIO(data)), tile)
        except Exception as exc:  # noqa: BLE001
            raise errors.bad_request(f"Could not read an image: {exc}", "bad_image")
        canvas.paste(tile_img, pos)
    return canvas


def make_grid_video(images: list[bytes], out_path: str) -> None:
    """Write a 2x2 grid MP4 (with a fade-in) built from exactly 4 images."""
    if len(images) != 4:
        raise errors.bad_request("Exactly 4 images are required.", "need_four_images")

    import imageio.v2 as imageio
    import numpy as np

    grid = _build_grid(images)
    base = np.asarray(grid, dtype=np.uint8)
    total = FPS * DURATION_S

    writer = imageio.get_writer(
        out_path,
        format="FFMPEG",
        mode="I",
        fps=FPS,
        codec="libx264",
        quality=7,
        macro_block_size=None,  # dims are even (1080); skip auto-resize
        ffmpeg_params=["-pix_fmt", "yuv420p"],  # broad player/browser compatibility
    )
    try:
        for i in range(total):
            if i < FADE_FRAMES:
                factor = (i + 1) / FADE_FRAMES
                frame = (base.astype(np.float32) * factor).astype(np.uint8)
            else:
                frame = base
            writer.append_data(frame)
    finally:
        writer.close()

    logger.info("Generated 2x2 grid video: %s (%d frames)", out_path, total)


def make_fade_video(image: bytes, out_path: str) -> None:
    """Write a single-image MP4 with a fade-in from black, cover-fit to 1080x1080."""
    import imageio.v2 as imageio
    import numpy as np
    from PIL import Image

    try:
        frame_img = _cover(Image.open(io.BytesIO(image)), CANVAS)
    except Exception as exc:  # noqa: BLE001
        raise errors.bad_request(f"Could not read the image: {exc}", "bad_image")

    base = np.asarray(frame_img, dtype=np.uint8)
    total = FPS * DURATION_S
    fade = FPS  # ~1s fade-in for the single-image format

    writer = imageio.get_writer(
        out_path,
        format="FFMPEG",
        mode="I",
        fps=FPS,
        codec="libx264",
        quality=7,
        macro_block_size=None,
        ffmpeg_params=["-pix_fmt", "yuv420p"],
    )
    try:
        for i in range(total):
            if i < fade:
                factor = (i + 1) / fade
                writer.append_data((base.astype(np.float32) * factor).astype(np.uint8))
            else:
                writer.append_data(base)
    finally:
        writer.close()

    logger.info("Generated fade-in video: %s (%d frames)", out_path, total)


def probe_dimensions(data: bytes) -> tuple[int, int] | None:
    """Best-effort (width, height) of an encoded video; None if it can't be read.

    FFmpeg needs a seekable file to probe reliably, so write to a temp file first.
    """
    import os
    import tempfile

    tmp = None
    try:
        import imageio.v2 as imageio

        fd, tmp = tempfile.mkstemp(suffix=".mp4")
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
        reader = imageio.get_reader(tmp, format="FFMPEG")
        size = reader.get_meta_data().get("size")
        reader.close()
        if size and len(size) == 2:
            return int(size[0]), int(size[1])
    except Exception:  # noqa: BLE001 - dimensions are optional metadata
        return None
    finally:
        if tmp and os.path.exists(tmp):
            try:
                os.remove(tmp)
            except OSError:
                pass
    return None
