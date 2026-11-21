CREATE TABLE "fixed_page" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"kind" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"position" integer NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "fixed_page_kind_idx" ON "fixed_page" ("kind");--> statement-breakpoint
ALTER TABLE "fixed_page" ADD CONSTRAINT "fixed_page_kind_kind_name_fkey" FOREIGN KEY ("kind") REFERENCES "kind"("name");