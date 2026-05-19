-- Add refSlug to affiliates table for ?ref= link tracking
ALTER TABLE "affiliate" ADD COLUMN IF NOT EXISTS "refSlug" text;
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_ref_slug_idx" ON "affiliate" ("refSlug");
