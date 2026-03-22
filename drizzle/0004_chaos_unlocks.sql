CREATE TABLE IF NOT EXISTS "chaos_unlock" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "modifierId" text NOT NULL,
  "unlockedAt" timestamp DEFAULT now(),
  UNIQUE("userId", "modifierId")
);
