CREATE TABLE "archetypes" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"share" real NOT NULL,
	"lists" integer NOT NULL,
	"cards" jsonb NOT NULL,
	"pokemon" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
