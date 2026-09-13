ALTER TABLE "games" ADD COLUMN "won_coin_toss" boolean;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "coin_toss_choice" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "went_first" boolean;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_coin_toss_choice_check" CHECK ("games"."coin_toss_choice" in ('first', 'second'));