ALTER TABLE "games" ADD COLUMN "result" text;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_result_check" CHECK ("games"."result" in ('win', 'loss'));