-- QRXP Schema Migration 0002: BudgetGovernor Ledger (§13.5, B1-B4, Fix 11)
-- Persists daily provider token buckets (visitor, owner, background) with UTC midnight resets

CREATE TABLE IF NOT EXISTS governor_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  day_utc TEXT NOT NULL,
  visitor_tokens INTEGER NOT NULL DEFAULT 0,
  owner_tokens INTEGER NOT NULL DEFAULT 0,
  background_tokens INTEGER NOT NULL DEFAULT 0,
  requests_count INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_rate_limited_until TIMESTAMPTZ,
  effective_tpm_discount REAL NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_governor_provider_day UNIQUE (provider_id, day_utc)
);

CREATE INDEX IF NOT EXISTS idx_governor_provider_day ON governor_ledger(provider_id, day_utc);
