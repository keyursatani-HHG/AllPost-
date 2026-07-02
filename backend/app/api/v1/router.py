"""Aggregate v1 API router."""
from fastapi import APIRouter

from app.api.v1 import analytics, auth, posts, schedule, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(posts.router)
api_router.include_router(schedule.router)
api_router.include_router(analytics.router)
