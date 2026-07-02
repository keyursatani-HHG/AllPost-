"""Domain error type and JSON error handlers with a stable response shape."""
from __future__ import annotations

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger

logger = get_logger(__name__)


class APIError(Exception):
    """Raised by services/handlers; rendered as {detail, code}."""

    def __init__(self, status_code: int, detail: str, code: str | None = None) -> None:
        self.status_code = status_code
        self.detail = detail
        self.code = code
        super().__init__(detail)


# Convenience constructors -------------------------------------------------- #
def not_found(detail: str = "Resource not found", code: str = "not_found") -> APIError:
    return APIError(status.HTTP_404_NOT_FOUND, detail, code)


def forbidden(detail: str = "You don't have access to this resource") -> APIError:
    return APIError(status.HTTP_403_FORBIDDEN, detail, "forbidden")


def unauthorized(detail: str = "Not authenticated", code: str = "not_authenticated") -> APIError:
    return APIError(status.HTTP_401_UNAUTHORIZED, detail, code)


def conflict(detail: str, code: str = "conflict") -> APIError:
    return APIError(status.HTTP_409_CONFLICT, detail, code)


def bad_request(detail: str, code: str = "bad_request") -> APIError:
    return APIError(status.HTTP_400_BAD_REQUEST, detail, code)


# Handlers ------------------------------------------------------------------ #
async def api_error_handler(_: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code, content={"detail": exc.detail, "code": exc.code}
    )


async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    # Preserve FastAPI's field-level shape but strip non-serialisable context.
    errors = [
        {"loc": list(e.get("loc", [])), "msg": e.get("msg", ""), "type": e.get("type", "")}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors, "code": "validation_error"},
    )


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "code": "internal_error"},
    )
