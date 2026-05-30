CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" text NOT NULL,
	"addressee_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "friend_code" text;--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_pair_idx" ON "friendships" USING btree ("requester_id","addressee_id");--> statement-breakpoint
CREATE INDEX "friendships_addressee_idx" ON "friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "friendships_requester_idx" ON "friendships" USING btree ("requester_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_friend_code_unique" UNIQUE("friend_code");