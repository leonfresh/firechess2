-- Chaos Chess ELO ratings table
CREATE TABLE IF NOT EXISTS "chaos_rating" (
  "userId" text PRIMARY KEY,
  "rating" integer NOT NULL DEFAULT 1200,
  "wins" integer NOT NULL DEFAULT 0,
  "losses" integer NOT NULL DEFAULT 0,
  "draws" integer NOT NULL DEFAULT 0,
  "gamesPlayed" integer NOT NULL DEFAULT 0,
  "peakRating" integer NOT NULL DEFAULT 1200,
  "updatedAt" timestamp
);

ALTER TABLE "chaos_rating"
  ADD CONSTRAINT "chaos_rating_userId_user_id_fk"
  FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

-- Time control columns on chaos_room
ALTER TABLE "chaos_room" ADD COLUMN IF NOT EXISTS "timeControlSeconds" integer;
ALTER TABLE "chaos_room" ADD COLUMN IF NOT EXISTS "incrementSeconds" integer DEFAULT 0;
ALTER TABLE "chaos_room" ADD COLUMN IF NOT EXISTS "timerWhiteMs" integer;
ALTER TABLE "chaos_room" ADD COLUMN IF NOT EXISTS "timerBlackMs" integer;
