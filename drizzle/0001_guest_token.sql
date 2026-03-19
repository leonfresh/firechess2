CREATE TABLE "affiliate_referral" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliateId" text NOT NULL,
	"userId" text,
	"stripeSessionId" text,
	"planType" text DEFAULT 'pro' NOT NULL,
	"amountCents" integer DEFAULT 0 NOT NULL,
	"commissionCents" integer DEFAULT 0 NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliate" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"stripePromoCodeId" text,
	"stripePromoCode" text,
	"commissionPct" integer DEFAULT 20 NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chaos_lobby_message" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"userName" text DEFAULT 'Anonymous' NOT NULL,
	"userImage" text,
	"message" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chaos_presence" (
	"userId" text PRIMARY KEY NOT NULL,
	"userName" text DEFAULT 'Anonymous' NOT NULL,
	"userImage" text,
	"lastSeen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chaos_rating" (
	"userId" text PRIMARY KEY NOT NULL,
	"rating" integer DEFAULT 1200 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"gamesPlayed" integer DEFAULT 0 NOT NULL,
	"peakRating" integer DEFAULT 1200 NOT NULL,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chaos_room" (
	"id" text PRIMARY KEY NOT NULL,
	"roomCode" text NOT NULL,
	"hostId" text NOT NULL,
	"guestId" text,
	"hostColor" text DEFAULT 'white' NOT NULL,
	"fen" text DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' NOT NULL,
	"chaosState" jsonb,
	"moveHistory" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'waiting' NOT NULL,
	"lastMoveFrom" text,
	"lastMoveTo" text,
	"difficulty" text DEFAULT 'medium',
	"isMatchmaking" boolean DEFAULT false,
	"timeControlSeconds" integer,
	"incrementSeconds" integer DEFAULT 0,
	"timerWhiteMs" integer,
	"timerBlackMs" integer,
	"capturedPawnsWhite" integer DEFAULT 0,
	"capturedPawnsBlack" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "chaos_room_roomCode_unique" UNIQUE("roomCode")
);
--> statement-breakpoint
CREATE TABLE "daily_login" (
	"userId" text PRIMARY KEY NOT NULL,
	"currentDay" integer DEFAULT 0 NOT NULL,
	"lastClaimDate" text DEFAULT '' NOT NULL,
	"totalDaysLogged" integer DEFAULT 0 NOT NULL,
	"cyclesCompleted" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gift_link" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"token" text NOT NULL,
	"maxUses" integer DEFAULT 50 NOT NULL,
	"usedCount" integer DEFAULT 0 NOT NULL,
	"planType" text DEFAULT 'pro' NOT NULL,
	"durationDays" integer,
	"expiresAt" timestamp,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "gift_link_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "gift_redemption" (
	"id" text PRIMARY KEY NOT NULL,
	"giftLinkId" text NOT NULL,
	"userId" text NOT NULL,
	"redeemedAt" timestamp DEFAULT now(),
	CONSTRAINT "gift_redemption_giftLinkId_userId_unique" UNIQUE("giftLinkId","userId")
);
--> statement-breakpoint
CREATE TABLE "roast_daily_reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"moveIdx" integer NOT NULL,
	"emoji" text NOT NULL,
	"displayName" text DEFAULT 'Anonymous',
	"userId" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roast_score" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"gamesPlayed" integer DEFAULT 0 NOT NULL,
	"streakCount" integer DEFAULT 0 NOT NULL,
	"quizScore" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "guestToken" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "launcher_config" jsonb;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_affiliateId_affiliate_id_fk" FOREIGN KEY ("affiliateId") REFERENCES "public"."affiliate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaos_lobby_message" ADD CONSTRAINT "chaos_lobby_message_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaos_presence" ADD CONSTRAINT "chaos_presence_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaos_rating" ADD CONSTRAINT "chaos_rating_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_login" ADD CONSTRAINT "daily_login_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_redemption" ADD CONSTRAINT "gift_redemption_giftLinkId_gift_link_id_fk" FOREIGN KEY ("giftLinkId") REFERENCES "public"."gift_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_redemption" ADD CONSTRAINT "gift_redemption_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roast_score" ADD CONSTRAINT "roast_score_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;