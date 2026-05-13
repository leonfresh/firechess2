CREATE TABLE "scan_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"guestToken" text,
	"chessUsername" text NOT NULL,
	"source" text NOT NULL,
	"scanMode" text DEFAULT 'both' NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"config" jsonb NOT NULL,
	"result" jsonb,
	"reportMeta" jsonb,
	"error" text,
	"savedReportId" text,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "scan_session" ADD CONSTRAINT "scan_session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "scan_session" ADD CONSTRAINT "scan_session_savedReportId_report_id_fk" FOREIGN KEY ("savedReportId") REFERENCES "report"("id") ON DELETE set null ON UPDATE no action;