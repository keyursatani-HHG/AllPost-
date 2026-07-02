"""Async Redis client with graceful degradation when Redis is unavailable."""
from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_client: aioredis.Redis | None = None


async def init_redis() -> None:
    """Create and ping the Redis client on startup (best-effort)."""
    global _client
    try:
        _client = aioredis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
        await _client.ping()
        logger.info("Connected to Redis")
    except Exception as exc:  # noqa: BLE001 - degrade gracefully
        logger.warning("Redis unavailable (%s); rate limiting will no-op", exc)
        _client = None


async def close_redis() -> None:
    if _client is not None:
        await _client.aclose()


def get_redis() -> aioredis.Redis | None:
    return _client
