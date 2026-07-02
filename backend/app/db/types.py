"""Dialect-portable column types.

Keeps **native UUID + JSONB on PostgreSQL** (production) while remaining usable
on SQLite for local dev runs and tests — no behavioural change on Postgres.
"""
from __future__ import annotations

from sqlalchemy import JSON, Uuid
from sqlalchemy.dialects.postgresql import JSONB as _PG_JSONB

# UUID: native ``uuid`` on PostgreSQL, ``CHAR(32)`` on SQLite.
GUID = Uuid

# JSONB on PostgreSQL, generic JSON elsewhere.
JSONB = JSON().with_variant(_PG_JSONB(), "postgresql")
