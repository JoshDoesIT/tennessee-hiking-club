CREATE TABLE "photo_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"trail_slug" text NOT NULL,
	"blob_url" text NOT NULL,
	"alt" text NOT NULL,
	"credit" text,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "photo_submissions_user_id_idx" ON "photo_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "photo_submissions_review_status_idx" ON "photo_submissions" USING btree ("review_status");