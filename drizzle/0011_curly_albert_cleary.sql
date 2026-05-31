CREATE TABLE "waypoint_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"trail_slug" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"photo_url" text,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "waypoint_submissions_user_id_idx" ON "waypoint_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "waypoint_submissions_review_status_idx" ON "waypoint_submissions" USING btree ("review_status");