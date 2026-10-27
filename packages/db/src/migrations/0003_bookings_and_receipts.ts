/**
 * Migration 0003: Bookings table and escalation receipt token support
 */

export const MIGRATION_0003_BOOKINGS_NAME = '0003_bookings_and_receipts';

export const MIGRATION_0003_BOOKINGS_SQL = `
-- 1. Extend escalations with receipt status_token, visitor_contact, rejection_reason
ALTER TABLE escalations ADD COLUMN IF NOT EXISTS status_token TEXT;
ALTER TABLE escalations ADD COLUMN IF NOT EXISTS visitor_contact TEXT;
ALTER TABLE escalations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_escalations_status_token ON escalations(status_token);

-- 2. Bookings Table (§6.1, §6.2, UX-11)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  visitor_name TEXT,
  visitor_contact TEXT NOT NULL,
  facets JSONB,
  preferred_time TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
`;
