-- Add launcher_config column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "launcher_config" jsonb;

-- Create site_config table for admin-controlled global settings (incl. launcher default)
CREATE TABLE IF NOT EXISTS "site_config" (
  "key" text PRIMARY KEY,
  "value" jsonb NOT NULL,
  "updatedAt" timestamp DEFAULT now()
);
