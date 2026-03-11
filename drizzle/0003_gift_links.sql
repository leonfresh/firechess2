-- Gift link system migration

CREATE TABLE "gift_link" (
  "id" text PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "token" text NOT NULL,
  "maxUses" integer NOT NULL DEFAULT 50,
  "usedCount" integer NOT NULL DEFAULT 0,
  "planType" text NOT NULL DEFAULT 'pro',
  "durationDays" integer,
  "expiresAt" timestamp,
  "revokedAt" timestamp,
  "createdAt" timestamp DEFAULT now(),
  CONSTRAINT "gift_link_token_unique" UNIQUE("token")
);

CREATE TABLE "gift_redemption" (
  "id" text PRIMARY KEY NOT NULL,
  "giftLinkId" text NOT NULL,
  "userId" text NOT NULL,
  "redeemedAt" timestamp DEFAULT now(),
  CONSTRAINT "gift_redemption_giftLinkId_userId_unique" UNIQUE("giftLinkId","userId")
);

ALTER TABLE "gift_redemption"
  ADD CONSTRAINT "gift_redemption_giftLinkId_gift_link_id_fk"
  FOREIGN KEY ("giftLinkId") REFERENCES "gift_link"("id") ON DELETE cascade;

ALTER TABLE "gift_redemption"
  ADD CONSTRAINT "gift_redemption_userId_user_id_fk"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade;
