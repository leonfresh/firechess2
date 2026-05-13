CREATE TABLE "community_post" (
	"id" text PRIMARY KEY NOT NULL,
	"authorId" text NOT NULL,
	"slug" text NOT NULL,
	"kind" text DEFAULT 'position' NOT NULL,
	"sourceType" text DEFAULT 'manual' NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"description" text,
	"fen" text NOT NULL,
	"pgn" text,
	"orientation" text DEFAULT 'white' NOT NULL,
	"openingName" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"collectionKey" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"previewMode" text DEFAULT 'board' NOT NULL,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"commentsCount" integer DEFAULT 0 NOT NULL,
	"savesCount" integer DEFAULT 0 NOT NULL,
	"hotScore" real DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "community_post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"authorId" text,
	"parentId" text,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"kind" text DEFAULT 'like' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "community_reaction_post_user_kind_unique" UNIQUE("postId","userId","kind")
);
--> statement-breakpoint
ALTER TABLE "community_post" ADD CONSTRAINT "community_post_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "community_comment" ADD CONSTRAINT "community_comment_postId_community_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_post"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "community_comment" ADD CONSTRAINT "community_comment_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "community_reaction" ADD CONSTRAINT "community_reaction_postId_community_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_post"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "community_reaction" ADD CONSTRAINT "community_reaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;