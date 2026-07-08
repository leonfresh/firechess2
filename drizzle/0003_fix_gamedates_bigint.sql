-- Fix column type for gamesStartDate and gamesEndDate
-- Postgres INTEGER (max ~2.1B) can't hold epoch milliseconds (e.g. 1782310361000)
ALTER TABLE "report" ALTER COLUMN "gamesStartDate" TYPE bigint;
ALTER TABLE "report" ALTER COLUMN "gamesEndDate" TYPE bigint;
