"""Fixed-window rate limiting dependency backed by Redis (no-ops without Redis)."""
from __future__ import annotations

import time

from fastapi import Request

from app.core import errors
from app.core.redis import get_redis


def rate_limit(limit_per_minute: int, scope: str):
    """Return a dependency that limits `limit_per_minute` requests per client."""

    async def _dependency(request: Request) -> None:
        redis = get_redis()
        if redis is None:
            return  # degrade gracefully when Redis isn't configured

        ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()

        window = int(time.time() // 60)
        key = f"rl:{scope}:{ip}:{window}"
        try:
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, 60)
        except Exception:  # noqa: BLE001 - never fail a request because of Redis
            return
        if count > limit_per_minute:
            raise errors.APIError(429, "Too many requests. Please slow down.", "rate_limited")

    return _dependency
