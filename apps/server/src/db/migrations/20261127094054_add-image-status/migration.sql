CREATE TYPE "image_status" AS ENUM('processing', 'failed', 'unpublished', 'published');--> statement-breakpoint
ALTER TABLE "image" ADD COLUMN "status" "image_status";--> statement-breakpoint
UPDATE "image" SET "status" = CASE WHEN "published_at" IS NULL THEN 'unpublished'::"image_status" ELSE 'published'::"image_status" END;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_published_at_check" CHECK (("status" = 'published') = ("published_at" is not null));
