CREATE TABLE "ghost_game" (
	"id" text PRIMARY KEY NOT NULL,
	"whiteName" text NOT NULL,
	"blackName" text NOT NULL,
	"whiteElo" integer,
	"blackElo" integer,
	"tournament" text NOT NULL,
	"eventDate" text NOT NULL,
	"result" text NOT NULL,
	"eco" text,
	"openingName" text,
	"pgnMoves" text NOT NULL,
	"moves" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"playAs" text NOT NULL,
	"startPly" integer NOT NULL,
	"endPly" integer NOT NULL,
	"missionTitle" text NOT NULL,
	"missionContext" text NOT NULL,
	"missionObjective" text NOT NULL,
	"difficulty" text DEFAULT 'intermediate' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"cookCandidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sourceUrl" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ghost_result" (
	"id" text PRIMARY KEY NOT NULL,
	"gameId" text NOT NULL,
	"userId" text,
	"guestToken" text,
	"syncRate" real DEFAULT 0 NOT NULL,
	"movesPlayed" integer DEFAULT 0 NOT NULL,
	"movesMatched" integer DEFAULT 0 NOT NULL,
	"cookFound" boolean DEFAULT false NOT NULL,
	"cookPly" integer,
	"cookUci" text,
	"completedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ghost_result" ADD CONSTRAINT "ghost_result_gameId_ghost_game_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."ghost_game"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ghost_result" ADD CONSTRAINT "ghost_result_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
