CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "coin_purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"itemId" text NOT NULL,
	"amount" integer NOT NULL,
	"purchasedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"email" text,
	"subject" text,
	"category" text DEFAULT 'other' NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"chessUsername" text NOT NULL,
	"source" text NOT NULL,
	"scanMode" text DEFAULT 'both' NOT NULL,
	"gamesAnalyzed" integer DEFAULT 0 NOT NULL,
	"maxGames" integer,
	"maxMoves" integer,
	"cpThreshold" integer,
	"engineDepth" integer,
	"estimatedAccuracy" real,
	"estimatedRating" real,
	"weightedCpLoss" real,
	"severeLeakRate" real,
	"repeatedPositions" integer DEFAULT 0,
	"leakCount" integer DEFAULT 0,
	"tacticsCount" integer DEFAULT 0,
	"reportMeta" jsonb,
	"leaks" jsonb DEFAULT '[]'::jsonb,
	"oneOffMistakes" jsonb DEFAULT '[]'::jsonb,
	"missedTactics" jsonb DEFAULT '[]'::jsonb,
	"diagnostics" jsonb,
	"mentalStats" jsonb,
	"timeManagement" jsonb,
	"firechessScore" real,
	"playerRating" integer,
	"contentHash" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"reportId" text,
	"chessUsername" text,
	"source" text,
	"title" text NOT NULL,
	"weaknesses" jsonb,
	"progress" integer DEFAULT 0 NOT NULL,
	"currentStreak" integer DEFAULT 0 NOT NULL,
	"longestStreak" integer DEFAULT 0 NOT NULL,
	"lastActivityDate" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_task" (
	"id" text PRIMARY KEY NOT NULL,
	"planId" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"recurring" boolean DEFAULT false NOT NULL,
	"dayIndex" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"link" text,
	"icon" text DEFAULT '📝' NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"userId" text PRIMARY KEY NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"currentPeriodEnd" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"weeklyDigest" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_reply" (
	"id" text PRIMARY KEY NOT NULL,
	"feedbackId" text NOT NULL,
	"userId" text,
	"isAdmin" boolean DEFAULT false NOT NULL,
	"message" text NOT NULL,
	"emailSent" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_coins" (
	"userId" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_purchase" ADD CONSTRAINT "coin_purchase_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plan" ADD CONSTRAINT "study_plan_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plan" ADD CONSTRAINT "study_plan_reportId_report_id_fk" FOREIGN KEY ("reportId") REFERENCES "public"."report"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_task" ADD CONSTRAINT "study_task_planId_study_plan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."study_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_reply" ADD CONSTRAINT "ticket_reply_feedbackId_feedback_id_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_reply" ADD CONSTRAINT "ticket_reply_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_coins" ADD CONSTRAINT "user_coins_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;