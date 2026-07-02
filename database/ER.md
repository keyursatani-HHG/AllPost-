# Postly — Database Design

PostgreSQL schema for the Postly social-media management platform. Canonical DDL
lives in [`schema.sql`](./schema.sql); the SQLAlchemy models in
`backend/app/models` are the source of truth for the application.

## ER Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    USERS ||--o{ REFRESH_TOKENS : "has sessions"
    USERS ||--o{ SOCIAL_ACCOUNTS : "connects"
    USERS ||--o{ POSTS : "authors"
    USERS ||--o{ SUBSCRIPTIONS : "subscribes"
    USERS ||--o{ PAYMENTS : "pays"
    SUBSCRIPTIONS ||--o{ PAYMENTS : "billed by"
    POSTS ||--o{ SCHEDULED_POSTS : "queued as"
    SOCIAL_ACCOUNTS ||--o{ SCHEDULED_POSTS : "target of"
    POSTS ||--o{ ANALYTICS : "measured by"
    SOCIAL_ACCOUNTS ||--o{ ANALYTICS : "source of"
    SCHEDULED_POSTS ||--o{ ANALYTICS : "produces"

    ROLES {
        uuid id PK
        role_name name UK
        varchar description
    }
    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar hashed_password
        varchar phone
        varchar company
        varchar avatar_url
        bool is_active
        bool is_verified
        timestamptz last_login_at
        uuid role_id FK
    }
    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar jti UK
        timestamptz expires_at
        bool revoked
    }
    SOCIAL_ACCOUNTS {
        uuid id PK
        uuid user_id FK
        social_platform platform
        varchar external_id
        varchar handle
        varchar access_token
        bool is_active
    }
    POSTS {
        uuid id PK
        uuid user_id FK
        text content
        jsonb media_urls
        jsonb hashtags
        post_status status
    }
    SCHEDULED_POSTS {
        uuid id PK
        uuid post_id FK
        uuid social_account_id FK
        timestamptz scheduled_at
        timestamptz published_at
        schedule_status status
        varchar external_post_id
    }
    ANALYTICS {
        uuid id PK
        uuid post_id FK
        uuid social_account_id FK
        uuid scheduled_post_id FK
        timestamptz captured_at
        int impressions
        int reach
        int likes
        int comments
        int shares
        int clicks
        numeric engagement_rate
    }
    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        subscription_plan plan
        subscription_status status
        timestamptz current_period_end
        bool cancel_at_period_end
    }
    PAYMENTS {
        uuid id PK
        uuid user_id FK
        uuid subscription_id FK
        int amount_cents
        varchar currency
        payment_status status
        varchar provider
    }
```

## Relationships

| Parent | Child | Cardinality | On delete |
|---|---|---|---|
| roles | users | 1 → N | RESTRICT (can't delete a role in use) |
| users | refresh_tokens | 1 → N | CASCADE |
| users | social_accounts | 1 → N | CASCADE |
| users | posts | 1 → N | CASCADE |
| users | subscriptions | 1 → N | CASCADE |
| users | payments | 1 → N | CASCADE |
| subscriptions | payments | 1 → N | SET NULL |
| posts | scheduled_posts | 1 → N | CASCADE |
| social_accounts | scheduled_posts | 1 → N | CASCADE |
| posts | analytics | 1 → N | CASCADE |
| social_accounts | analytics | 1 → N | CASCADE |
| scheduled_posts | analytics | 1 → N | SET NULL |

## Indexing strategy

- **Primary keys** are UUID v4 (`gen_random_uuid()`) — avoids sequential-ID
  enumeration and makes IDs safe to expose in the API.
- **Lookups:** unique index on `users.email`, unique `refresh_tokens.jti`
  (validated on every token refresh), unique
  `social_accounts (user_id, platform, external_id)`.
- **Foreign keys** are all indexed (Postgres does *not* auto-index FK columns) to
  keep joins and cascade deletes fast.
- **Hot query paths:**
  - `ix_scheduled_posts_due (status, scheduled_at)` — the publishing worker polls
    `WHERE status='queued' AND scheduled_at <= now()`; this composite index makes
    that a range scan.
  - `ix_posts_status`, `ix_subscriptions_status`, `ix_payments_status` — status
    filters used by list endpoints and billing jobs.
  - `ix_analytics_captured_at` — time-range analytics rollups.

## Optimization & scaling notes

- **Connection pooling** via SQLAlchemy async engine (`pool_size=10`,
  `max_overflow=20`, `pool_pre_ping=True`). Put PgBouncer in front for high
  concurrency.
- **JSONB** for `media_urls` / `hashtags` avoids extra join tables for small,
  read-mostly arrays; add a GIN index if you later query inside them.
- **Analytics growth:** the `analytics` table is append-only and grows fastest.
  Partition by `captured_at` (monthly range partitions) and roll up into a
  materialized view for dashboards once volume warrants it.
- **Token hygiene:** a scheduled job should delete `refresh_tokens` where
  `expires_at < now()` or `revoked = true` to keep the table small.
- **Encrypt** `social_accounts.access_token / refresh_token` at rest
  (pgcrypto or application-level KMS) — they are OAuth credentials.
- **Read replicas:** analytics/reporting reads can target a replica; writes
  (publishing, auth) stay on the primary.
