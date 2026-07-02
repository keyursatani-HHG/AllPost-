# Postly API (FastAPI)

Production-oriented FastAPI backend for the Postly platform.

## Architecture

```
app/
├── main.py              App factory: middleware, CORS, exception handlers, lifespan
├── core/                config · security (JWT + bcrypt) · logging · redis · errors
├── db/                  async engine/session · declarative base · init_db (dev bootstrap)
├── models/              SQLAlchemy 2.0 models (users, roles, posts, schedules, …)
├── schemas/             Pydantic v2 request/response models
├── services/            Business logic (auth, users, posts, schedule, analytics)
├── api/
│   ├── deps.py          get_current_user · require_roles(RBAC) · pagination
│   ├── rate_limit.py    Redis fixed-window limiter
│   └── v1/              Routers: auth · users · posts · schedule · analytics
└── middleware/          Request-id + timing logging
```

Layering: **router → service → model**. Routers do HTTP; services hold logic and
own transactions; models are persistence only.

## Setup

**Docker (Postgres + Redis + API):**

```bash
cp .env.example .env
docker compose up --build       # http://localhost:8000/docs
```

**Local:**

```bash
python -m venv .venv && . .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                                # set SECRET_KEY etc.
python -m app.db.init_db                            # create tables + seed roles
uvicorn app.main:app --reload
```

## Configuration

All via env (see `.env.example`): `SECRET_KEY`, `DATABASE_URL` (asyncpg),
`REDIS_URL`, `BACKEND_CORS_ORIGINS`, token lifetimes, cookie flags
(`COOKIE_SECURE`/`COOKIE_SAMESITE` — set `COOKIE_SECURE=true` in production),
rate limits, and AWS S3 settings.

## Authentication flow

1. `POST /auth/register` | `/auth/login` → returns `{ user, tokens }` and sets an
   **httpOnly** `postly_refresh` cookie.
2. Client sends `Authorization: Bearer <access_token>` on requests.
3. On expiry, `POST /auth/refresh` (cookie only) **rotates** the refresh token
   (old one revoked in `refresh_tokens`) and returns a fresh pair.
4. `POST /auth/logout` revokes the refresh token and clears the cookie.
5. `POST /auth/reset-password` also revokes all of the user's sessions.

Passwords: bcrypt (72-byte safe). Access tokens: HS256 JWT with `sub`, `role`,
`type`, `jti`, `exp`.

## Endpoint reference

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | – | Create account (rate-limited) |
| POST | `/api/v1/auth/login` | – | Email + password |
| POST | `/api/v1/auth/refresh` | cookie | Rotate tokens |
| POST | `/api/v1/auth/logout` | cookie | Revoke session |
| GET | `/api/v1/auth/me` | ✔ | Current user |
| POST | `/api/v1/auth/forgot-password` | – | Always 200 (no enumeration) |
| POST | `/api/v1/auth/reset-password` | – | Token from email |
| GET/PATCH | `/api/v1/users/me` | ✔ | Profile |
| POST | `/api/v1/users/me/change-password` | ✔ | |
| GET | `/api/v1/users` | admin/owner | Paginated list (RBAC) |
| GET/POST | `/api/v1/posts` | ✔ | List (paginated, `?status=`) / create |
| GET/PATCH/DELETE | `/api/v1/posts/{id}` | ✔ | Owner-scoped |
| GET/POST | `/api/v1/schedule/accounts` | ✔ | Connected social accounts |
| DELETE | `/api/v1/schedule/accounts/{id}` | ✔ | Disconnect |
| GET/POST | `/api/v1/schedule` | ✔ | List / schedule to N accounts |
| POST | `/api/v1/schedule/{id}/cancel` | ✔ | Cancel a queued post |
| GET | `/api/v1/analytics/summary` | ✔ | Aggregate + per-platform |
| GET | `/api/v1/analytics/posts/{id}` | ✔ | Snapshots for a post |

Errors use a stable shape: `{ "detail": "...", "code": "..." }`; validation
errors return `{ "detail": [{loc,msg,type}], "code": "validation_error" }`.

## Migrations (Alembic)

```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```

`alembic/env.py` is async-aware and reads `DATABASE_URL` + `Base.metadata`
from the app.

## Notes / next steps

- Social publishing workers and OAuth connect flows are stubbed (models +
  scheduling exist); wire platform SDKs behind `schedule_service`.
- Encrypt `social_accounts` tokens at rest before production.
