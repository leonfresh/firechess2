ALTER TABLE "feedback"
ADD COLUMN "lastAdminReplyAt" timestamp,
ADD COLUMN "userLastViewedAt" timestamp;--> statement-breakpoint

UPDATE "feedback" AS f
SET "lastAdminReplyAt" = replies."lastReplyAt"
FROM (
  SELECT "feedbackId", max("createdAt") AS "lastReplyAt"
  FROM "ticket_reply"
  WHERE "isAdmin" = true
  GROUP BY "feedbackId"
) AS replies
WHERE f."id" = replies."feedbackId";--> statement-breakpoint

UPDATE "feedback"
SET "userLastViewedAt" = "createdAt"
WHERE "userLastViewedAt" IS NULL;--> statement-breakpoint