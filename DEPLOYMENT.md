# Deploying Postly

Postly is **two apps** that deploy to **two different hosts**:

| App | Tech | Host |
|---|---|---|
| `frontend/` | Next.js 15 | **Netlify** ← this guide |
| `backend/` | FastAPI + PostgreSQL + Redis | A Python host: **Render**, Railway, or Fly.io (Netlify can't run it) |

> The home/marketing page is static and works on Netlify by itself. **Login,
> Register and Google sign-in only work once the backend is also deployed** and
> `NEXT_PUBLIC_API_URL` points at it.

---

## 1. Frontend → Netlify

Everything is preconfigured in [`netlify.toml`](netlify.toml) (base = `frontend`,
Next.js runtime plugin, Node 20).

### Option A — Connect a Git repo (recommended)
1. Push this project to GitHub/GitLab/Bitbucket.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
3. Netlify reads `netlify.toml` automatically (base directory = `frontend`).
4. Add the environment variables below → **Deploy**.

### Option B — Netlify CLI (no Git needed)
```bash
npm install -g netlify-cli
netlify login
# run from the PROJECT ROOT (G:\AI\AllPost):
netlify deploy --build --prod
```
The first run prompts you to create/link a site.

### Environment variables (Netlify → Site settings → Environment variables)
| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend-host>/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-site>.netlify.app` |

`NEXT_PUBLIC_*` values are baked in at build time — **redeploy** after changing them.

---

## 2. Backend → Render (one-click blueprint)

A [`render.yaml`](render.yaml) blueprint is included — it provisions PostgreSQL,
Redis, and the FastAPI web service in one step.

1. Render Dashboard → **New + → Blueprint** → select this repo.
2. Render reads `render.yaml`, creates the DB + Redis + API, and auto-generates
   `SECRET_KEY`. `DATABASE_URL` is wired automatically (managed `postgres://`
   URLs are auto-converted to the async driver by the app).
3. After your Netlify site exists, fill the `sync: false` env vars in the Render
   UI:
   - `FRONTEND_URL` = `https://<your-site>.netlify.app`
   - `BACKEND_CORS_ORIGINS` = `https://<your-site>.netlify.app`
   - Google (optional): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
     `GOOGLE_REDIRECT_URI` = `https://<backend-host>/api/v1/auth/google/callback`
4. Copy the backend URL (e.g. `https://postly-api.onrender.com`) and set
   Netlify's `NEXT_PUBLIC_API_URL` = `https://postly-api.onrender.com/api/v1`,
   then redeploy the frontend.

Prefer containers? The included [`backend/Dockerfile`](backend/Dockerfile) works
on any Docker host (Fly.io, Railway, ECS, …).

---

## 3. Production auth note (important)

In local dev the frontend and backend share `localhost`, so the httpOnly refresh
cookie is shared and everything "just works". In production on **different
domains** (`*.netlify.app` vs `*.onrender.com`) the cookie is **cross-site**:

- Set `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true` on the backend so the
  browser sends the refresh cookie on cross-site requests.
- The Next.js edge middleware can't read a cookie set on a *different* domain, so
  protected-route enforcement falls back to the client-side guard (already built
  into the dashboard). This is fine and secure — the API still authorizes every
  request via the Bearer token.

**Cleanest option:** put both apps under one domain — e.g. `app.postly.com`
(Netlify) + `api.postly.com` (backend) — and set `COOKIE_DOMAIN=.postly.com`.
Then the cookie is shared, `SameSite=Lax` works, and middleware guards work too.

If you go the Google route in production, also update the OAuth client's
**Authorized redirect URI** to the deployed backend callback and add the Netlify
URL to **Authorized JavaScript origins**.
