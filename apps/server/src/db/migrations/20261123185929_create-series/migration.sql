CREATE TABLE "series" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "series_image" (
	"series_id" uuid,
	"image_id" uuid,
	"position" integer NOT NULL,
	CONSTRAINT "series_image_pkey" PRIMARY KEY("series_id","image_id")
);
--> statement-breakpoint
CREATE INDEX "series_image_position_idx" ON "series_image" ("series_id","position");--> statement-breakpoint
CREATE INDEX "series_image_image_idx" ON "series_image" ("image_id");--> statement-breakpoint
ALTER TABLE "series_image" ADD CONSTRAINT "series_image_series_id_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "series_image" ADD CONSTRAINT "series_image_image_id_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE;