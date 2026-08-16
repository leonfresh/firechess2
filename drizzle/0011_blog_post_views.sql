CREATE TABLE IF NOT EXISTS "blog_post_view" (
	"slug" text PRIMARY KEY NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"lastViewedAt" timestamp DEFAULT now()
);