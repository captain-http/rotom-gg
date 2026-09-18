CREATE TABLE "tournament_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"html" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
