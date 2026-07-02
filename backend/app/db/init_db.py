"""Development bootstrap: create tables and seed reference data.

Usage:  python -m app.db.init_db
For production, use Alembic migrations instead of create_all.
"""
from __future__ import annotations

import asyncio

from sqlalchemy import select

from app import models  # noqa: F401  (registers all tables on Base.metadata)
from app.core.logging import configure_logging, get_logger
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.enums import RoleName
from app.models.role import Role

logger = get_logger(__name__)

ROLE_DESCRIPTIONS = {
    RoleName.owner: "Full account access, including billing.",
    RoleName.admin: "Manage users, content and settings.",
    RoleName.editor: "Create, schedule and publish content.",
    RoleName.viewer: "Read-only access to content and analytics.",
}


async def seed_roles() -> None:
    async with AsyncSessionLocal() as db:
        existing = {
            r.name for r in (await db.execute(select(Role))).scalars().all()
        }
        for name, description in ROLE_DESCRIPTIONS.items():
            if name not in existing:
                db.add(Role(name=name, description=description))
        await db.commit()
    logger.info("Roles seeded")


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables created")
    await seed_roles()
    await engine.dispose()


if __name__ == "__main__":
    configure_logging()
    asyncio.run(init_db())
