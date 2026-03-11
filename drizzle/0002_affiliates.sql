-- Affiliate system: creators who refer users to FireChess Pro
CREATE TABLE IF NOT EXISTS "affiliate" (
  "id"                text PRIMARY KEY,
  "name"              text NOT NULL,
  "email"             text,
  "stripePromoCodeId" text,
  "stripePromoCode"   text,
  "commissionPct"     integer NOT NULL DEFAULT 20,
  "notes"             text,
  "active"            boolean NOT NULL DEFAULT true,
  "createdAt"         timestamp DEFAULT now()
);

-- Per-sale referral records
CREATE TABLE IF NOT EXISTS "affiliate_referral" (
  "id"               text PRIMARY KEY,
  "affiliateId"      text NOT NULL REFERENCES "affiliate"("id") ON DELETE CASCADE,
  "userId"           text REFERENCES "user"("id") ON DELETE SET NULL,
  "stripeSessionId"  text,
  "planType"         text NOT NULL DEFAULT 'pro',
  "amountCents"      integer NOT NULL DEFAULT 0,
  "commissionCents"  integer NOT NULL DEFAULT 0,
  "paid"             boolean NOT NULL DEFAULT false,
  "paidAt"           timestamp,
  "createdAt"        timestamp DEFAULT now()
);

-- Index for fast lookups by promo code ID (used in webhook)
CREATE INDEX IF NOT EXISTS "affiliate_promo_code_idx"
  ON "affiliate" ("stripePromoCodeId");

-- Index for aggregations per affiliate
CREATE INDEX IF NOT EXISTS "affiliate_referral_affiliate_idx"
  ON "affiliate_referral" ("affiliateId");
