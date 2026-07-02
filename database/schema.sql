-- ============================================================================
--  Postly — PostgreSQL schema (canonical DDL)
--  Mirrors the SQLAlchemy models in backend/app/models.
--  Target: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
--  Enums
-- ----------------------------------------------------------------------------
CREATE TYPE role_name           AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE social_platform     AS ENUM ('instagram','tiktok','youtube','x','linkedin','facebook','pinterest','threads','bluesky');
CREATE TYPE post_status         AS ENUM ('draft','scheduled','publishing','published','failed','archived');
CREATE TYPE schedule_status     AS ENUM ('queued','publishing','published','failed','canceled');
CREATE TYPE subscription_plan   AS ENUM ('free','pro','business','enterprise');
CREATE TYPE subscription_status AS ENUM ('trialing','active','past_due','canceled','expired');
CREATE TYPE payment_status      AS ENUM ('pending','succeeded','failed','refunded');

-- ----------------------------------------------------------------------------
--  roles
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        role_name NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
--  users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    phone           VARCHAR(32),
    company         VARCHAR(120),
    avatar_url      VARCHAR(512),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_users_role_id ON users(role_id);
-- (email already has a unique index via UNIQUE)

-- ----------------------------------------------------------------------------
--  refresh_tokens  (rotation + server-side revocation)
-- ----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti        VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent VARCHAR(400),
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ----------------------------------------------------------------------------
--  social_accounts
-- ----------------------------------------------------------------------------
CREATE TABLE social_accounts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform         social_platform NOT NULL,
    external_id      VARCHAR(128) NOT NULL,
    handle           VARCHAR(120) NOT NULL,
    display_name     VARCHAR(160),
    avatar_url       VARCHAR(512),
    access_token     VARCHAR(2048),   -- encrypt at rest in production
    refresh_token    VARCHAR(2048),
    token_expires_at TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_social_account_identity UNIQUE (user_id, platform, external_id)
);
CREATE INDEX ix_social_accounts_user_id  ON social_accounts(user_id);
CREATE INDEX ix_social_accounts_platform ON social_accounts(platform);

-- ----------------------------------------------------------------------------
--  posts
-- ----------------------------------------------------------------------------
CREATE TABLE posts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    media_urls JSONB NOT NULL DEFAULT '[]',
    hashtags   JSONB NOT NULL DEFAULT '[]',
    status     post_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_posts_user_id ON posts(user_id);
CREATE INDEX ix_posts_status  ON posts(status);

-- ----------------------------------------------------------------------------
--  scheduled_posts  (one post -> one platform at a time)
-- ----------------------------------------------------------------------------
CREATE TABLE scheduled_posts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    scheduled_at      TIMESTAMPTZ NOT NULL,
    published_at      TIMESTAMPTZ,
    status            schedule_status NOT NULL DEFAULT 'queued',
    external_post_id  VARCHAR(190),
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_scheduled_posts_post_id           ON scheduled_posts(post_id);
CREATE INDEX ix_scheduled_posts_social_account_id ON scheduled_posts(social_account_id);
-- Publisher worker scans due jobs by (status, scheduled_at):
CREATE INDEX ix_scheduled_posts_due ON scheduled_posts(status, scheduled_at);

-- ----------------------------------------------------------------------------
--  analytics  (point-in-time metrics snapshots)
-- ----------------------------------------------------------------------------
CREATE TABLE analytics (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE SET NULL,
    captured_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    impressions       INTEGER NOT NULL DEFAULT 0,
    reach             INTEGER NOT NULL DEFAULT 0,
    likes             INTEGER NOT NULL DEFAULT 0,
    comments          INTEGER NOT NULL DEFAULT 0,
    shares            INTEGER NOT NULL DEFAULT 0,
    clicks            INTEGER NOT NULL DEFAULT 0,
    engagement_rate   NUMERIC(6,3) NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_analytics_post_id           ON analytics(post_id);
CREATE INDEX ix_analytics_social_account_id ON analytics(social_account_id);
CREATE INDEX ix_analytics_captured_at       ON analytics(captured_at);

-- ----------------------------------------------------------------------------
--  subscriptions
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan                     subscription_plan   NOT NULL DEFAULT 'free',
    status                   subscription_status NOT NULL DEFAULT 'trialing',
    current_period_start     TIMESTAMPTZ,
    current_period_end       TIMESTAMPTZ,
    cancel_at_period_end     BOOLEAN NOT NULL DEFAULT FALSE,
    external_subscription_id VARCHAR(190),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX ix_subscriptions_status  ON subscriptions(status);
CREATE INDEX ix_subscriptions_external_subscription_id ON subscriptions(external_subscription_id);

-- ----------------------------------------------------------------------------
--  payments
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount_cents        INTEGER NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'usd',
    status              payment_status NOT NULL DEFAULT 'pending',
    provider            VARCHAR(40) NOT NULL DEFAULT 'stripe',
    external_payment_id VARCHAR(190),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_payments_user_id             ON payments(user_id);
CREATE INDEX ix_payments_subscription_id     ON payments(subscription_id);
CREATE INDEX ix_payments_status              ON payments(status);
CREATE INDEX ix_payments_external_payment_id ON payments(external_payment_id);

-- ----------------------------------------------------------------------------
--  Seed reference roles
-- ----------------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
    ('owner',  'Full account access, including billing.'),
    ('admin',  'Manage users, content and settings.'),
    ('editor', 'Create, schedule and publish content.'),
    ('viewer', 'Read-only access to content and analytics.')
ON CONFLICT (name) DO NOTHING;
