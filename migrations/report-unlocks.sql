-- One-off report unlocks: a US$9 payment that shows every finding in one scan to the buyer.
--   node scripts/chaos-career-migrate.mjs migrations/report-unlocks.sql
-- Written by the Stripe webhook (checkout.session.completed with metadata.plan = 'report');
-- stripeSessionId is unique so a redelivered event records the unlock once.

CREATE TABLE IF NOT EXISTS report_unlock (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "scanId" text NOT NULL REFERENCES scan_session(id) ON DELETE CASCADE,
  "stripeSessionId" text NOT NULL UNIQUE,
  "amountCents" integer NOT NULL,
  "createdAt" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_unlock_user_scan ON report_unlock ("userId", "scanId");
