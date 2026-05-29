CREATE TABLE "trail_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"area" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"length_miles" double precision,
	"elevation_gain_ft" integer,
	"difficulty" text,
	"route_type" text,
	"description" text NOT NULL,
	"links" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "trail_submissions_user_id_idx" ON "trail_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trail_submissions_status_idx" ON "trail_submissions" USING btree ("status");