# Postly — Social Media Management SaaS

Full-stack implementation of the approved **Postly** design: a social-media
management platform to create, schedule, and publish content to every network
from one dashboard.

Built step by step: **Frontend → Backend → Database → APIs → Integration.**

```
AllPost/
├── frontend/          Next.js 15 · TypeScript · Tailwind · ShadCN-style UI · Framer Motion
├── backend/           FastAPI · SQLAlchemy 2 (async) · PostgreSQL · Redis · JWT · S3
├── database/          Canonical schema.sql + ER diagram
└── design-handoff/    The approved Claude Design bundle (reference)
```

The frontend is a **pixel-match of the approved handoff** (`design-handoff/.../Postly.dc.html`
+ `authpane.dc.html`): green brand (`#5BC878 → #22C55E`), Inter, orbiting platform
bubbles, dashboard mock, alternating feature rows, stats, testimonials, FAQ, blog,
dark CTA/footer, and dark-navy auth panels.

---

## Prerequisites

- **Node.js** ≥ 20 and npm
- **Python** ≥ 3.11
- **PostgreSQL** 14+ and **Redis** (or Docker to run both)

---

## Step 1 — Frontend

```bash
cd frontend
cp .env.example .env.local          # NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm install
npm run dev                         # http://localhost:3000
```

Pages: `/` (home), `/login`, `/register`, `/forgot-password`, `/dashboard` (protected).
Production build: `npm run build && npm start`. Type-check: `npm run typecheck`.

**Highlights:** mobile-first responsive, SEO/AEO/GEO-ready (metadata, sitemap,
robots, JSON-LD `Organization`/`WebSite`/`SoftwareApplication`/`FAQPage`),
reusable components, Zod + react-hook-form validation, loading/error states,
accessible (skip link, ARIA, reduced-motion).

## Step 2 — Backend

**With Docker (recommended — starts Postgres + Redis + API):**

```bash
cd backend
cp .env.example .env
docker compose up --build           # API on http://localhost:8000  (tables + roles auto-seeded)
```

**Local (bring your own Postgres + Redis):**

```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                                  # set SECRET_KEY, DATABASE_URL, REDIS_URL
python -m app.db.init_db                              # create tables + seed roles (dev)
uvicorn app.main:app --reload                         # http://localhost:8000
```

Interactive API docs: **http://localhost:8000/docs** · Health: `/health`.

**Highlights:** clean layered architecture (routers → services → models),
JWT access + rotating refresh tokens (httpOnly cookie), RBAC, forgot/reset
password, request-id logging, Redis rate limiting, `{detail, code}` error
envelope, CORS with credentials.

## Step 3 — Database

- [`database/schema.sql`](database/schema.sql) — canonical PostgreSQL DDL
  (enums, tables, FKs, indexes, seed roles).
- [`database/ER.md`](database/ER.md) — ER diagram, relationships, indexing &
  optimization notes.
- SQLAlchemy models: `backend/app/models/`. Migrations via Alembic:
  `cd backend && alembic revision --autogenerate -m "init" && alembic upgrade head`.

Tables: `roles`, `users`, `refresh_tokens`, `social_accounts`, `posts`,
`scheduled_posts`, `analytics`, `subscriptions`, `payments`.

## Step 4 — APIs

REST, versioned under `/api/v1`. Full request/response schemas, validation,
rate limiting, and OpenAPI docs. See [`backend/README.md`](backend/README.md)
for the full endpoint reference.

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `/login` · `/refresh` · `/logout` · `GET /auth/me` · `POST /auth/forgot-password` · `/reset-password` |
| Users | `GET/PATCH /users/me` · `POST /users/me/change-password` · `GET /users` (admin) |
| Posts | `GET/POST /posts` · `GET/PATCH/DELETE /posts/{id}` |
| Schedule | `GET/POST /schedule/accounts` · `DELETE /schedule/accounts/{id}` · `GET/POST /schedule` · `POST /schedule/{id}/cancel` |
| Analytics | `GET /analytics/summary` · `GET /analytics/posts/{id}` |

## Step 5 — Integration

The frontend is already wired to the backend contract:

- **API client** (`frontend/src/lib/api.ts`) — typed fetch wrapper, sends the
  access token, and transparently retries once via `/auth/refresh` on a 401
  (single-flight, so concurrent 401s share one refresh).
- **Auth state** (`frontend/src/providers/auth-provider.tsx`) — bootstraps the
  session on load from the httpOnly refresh cookie; exposes `login`, `register`,
  `logout`, `user`, `status`.
- **Token model** — access token kept in memory (never in `localStorage`);
  refresh token is an **httpOnly cookie** (`postly_refresh`) set by the backend
  and rotated on every refresh.
- **Protected routes** (`frontend/src/middleware.ts`) — edge middleware guards
  `/dashboard` and redirects authenticated users away from `/login`/`/register`,
  reading the httpOnly cookie.
- **Error handling** — backend's `{detail, code}` and FastAPI validation arrays
  are mapped to form field errors + toasts.

**Run the whole stack:**

```bash
# terminal 1 — backend + db + redis
cd backend && docker compose up --build

# terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:3000, register an account, and you'll be redirected to the
authenticated dashboard.

---

## Verification status

| Area | Verified |
|---|---|
| Frontend | `npm run build` clean (11 routes prerendered); Home/Login/Register visually **pixel-match** the handoff |
| Backend | App imports; full **OpenAPI** generates (19 API paths); bcrypt + JWT + schema validation smoke tests pass |
| Contract | Endpoints, `postly_refresh` cookie, and `/api/v1` base URL all match across frontend/backend |

> A live end-to-end auth run needs Postgres + Redis (not available in the build
> environment); `docker compose up` provides both.
