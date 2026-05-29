CREATE TABLE "condition_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"trail_slug" text NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"report_date" date NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "condition_submissions_user_id_idx" ON "condition_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "condition_submissions_review_status_idx" ON "condition_submissions" USING btree ("review_status");