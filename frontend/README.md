# Postly Frontend (Next.js 15)

Marketing site + authentication for Postly, a pixel-match of the approved design.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · ShadCN-style UI primitives ·
Framer Motion · react-hook-form + Zod · next-themes · sonner.

## Getting started

```bash
cp .env.example .env.local          # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL
npm install
npm run dev                         # http://localhost:3000
```

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`.

## Structure

```
src/
├── app/
│   ├── (auth)/{login,register,forgot-password}/   Auth pages (AuthShell)
│   ├── (app)/dashboard/                            Protected shell
│   ├── layout.tsx  page.tsx  globals.css           Root + home + design tokens
│   ├── loading.tsx error.tsx not-found.tsx         State boundaries
│   └── sitemap.ts robots.ts manifest.ts            SEO routes
├── components/
│   ├── ui/          Button, Input, Card, Badge, Accordion, Checkbox, Avatar, …
│   ├── layout/      Navbar, Footer
│   ├── sections/    Hero, Features, Stats, Testimonials, FAQ, Blog, CTA, …
│   ├── forms/       Login/Register/ForgotPassword, PasswordInput, SocialAuth
│   ├── auth/        AuthShell (split-screen brand panel)
│   └── shared/      Logo, Reveal (motion), JsonLd, SectionHeading
├── providers/       auth-provider, theme-provider
├── lib/             api (client) · validations (Zod) · site · content · utils
├── types/           Shared domain types (mirror backend schemas)
└── middleware.ts    Protected-route guard (reads httpOnly refresh cookie)
```

## Design system

All theming is token-based in `globals.css` (HSL CSS variables) + `tailwind.config.ts`.
Brand green `#5BC878 → #22C55E` lives in `--brand-*` and `bg-brand-gradient`.
Re-theming = editing those tokens.

## Backend integration

Set `NEXT_PUBLIC_API_URL` to the FastAPI base (`http://localhost:8000/api/v1`).
The API client auto-attaches the access token and refreshes on 401; see the
root [README](../README.md) → *Step 5 — Integration*.
