"""FastAPI application factory and entrypoint."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

import pathlib

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import (
    APIError,
    api_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging, get_logger
from app.core.redis import close_redis, init_redis
from app.middleware.request_context import RequestContextMiddleware

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s (%s)", settings.PROJECT_NAME, settings.ENVIRONMENT)
    await init_redis()

    # Background worker: publishes scheduled posts when they come due.
    from app.services import scheduler

    stop = asyncio.Event()
    worker = asyncio.create_task(scheduler.run(stop))

    yield

    stop.set()
    worker.cancel()
    with suppress(asyncio.CancelledError):
        await worker
    await close_redis()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=__version__,
        description="Postly — social media management platform API.",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # --- Middleware ---
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # --- Exception handlers ---
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # --- Routes ---
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Serve uploaded media (see app/api/v1/media.py).
    uploads = pathlib.Path("uploads")
    uploads.mkdir(exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    @app.get("/health", tags=["Health"], summary="Liveness probe")
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__, "environment": settings.ENVIRONMENT}

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"name": settings.PROJECT_NAME, "docs": "/docs"}

    return app


app = create_app()
