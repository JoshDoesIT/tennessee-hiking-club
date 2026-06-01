CREATE TABLE "route_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"trail_slug" text NOT NULL,
	"name" text,
	"route" text NOT NULL,
	"point_count" integer NOT NULL,
	"length_miles" double precision NOT NULL,
	"gain_ft" integer NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "route_submissions_user_id_idx" ON "route_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "route_submissions_review_status_idx" ON "route_submissions" USING btree ("review_status");