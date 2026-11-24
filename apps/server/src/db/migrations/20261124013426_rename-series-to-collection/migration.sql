ALTER TABLE "series" RENAME TO "collection";--> statement-breakpoint
ALTER TABLE "series_image" RENAME TO "collection_image";--> statement-breakpoint
ALTER TABLE "collection_image" RENAME COLUMN "series_id" TO "collection_id";--> statement-breakpoint
ALTER INDEX "series_image_position_idx" RENAME TO "collection_image_position_idx";--> statement-breakpoint
ALTER INDEX "series_image_image_idx" RENAME TO "collection_image_image_idx";--> statement-breakpoint
ALTER TABLE "collection_image" RENAME CONSTRAINT "series_image_series_id_series_id_fkey" TO "collection_image_collection_id_collection_id_fkey";--> statement-breakpoint
ALTER TABLE "collection_image" RENAME CONSTRAINT "series_image_image_id_image_id_fkey" TO "collection_image_image_id_image_id_fkey";--> statement-breakpoint
ALTER TABLE "collection" RENAME CONSTRAINT "series_pkey" TO "collection_pkey";--> statement-breakpoint
ALTER TABLE "collection_image" RENAME CONSTRAINT "series_image_pkey" TO "collection_image_pkey";--> statement-breakpoint
ALTER TABLE "collection" RENAME CONSTRAINT "series_slug_key" TO "collection_slug_key";--> statement-breakpoint
ALTER TABLE "collection" RENAME CONSTRAINT "series_id_not_null" TO "collection_id_not_null";--> statement-breakpoint
ALTER TABLE "collection" RENAME CONSTRAINT "series_name_not_null" TO "collection_name_not_null";--> statement-breakpoint
ALTER TABLE "collection" RENAME CONSTRAINT "series_slug_not_null" TO "collection_slug_not_null";--> statement-breakpoint
ALTER TABLE "collection_image" RENAME CONSTRAINT "series_image_series_id_not_null" TO "collection_image_collection_id_not_null";--> statement-breakpoint
ALTER TABLE "collection_image" RENAME CONSTRAINT "series_image_image_id_not_null" TO "collection_image_image_id_not_null";--> statement-breakpoint
ALTER TABLE "collection_image" RENAME CONSTRAINT "series_image_position_not_null" TO "collection_image_position_not_null";--> statement-breakpoint
ALTER TABLE "collection_image" DROP CONSTRAINT "collection_image_pkey";--> statement-breakpoint
ALTER TABLE "collection_image" ADD CONSTRAINT "collection_image_pkey" PRIMARY KEY("collection_id","image_id");--> statement-breakpoint
DROP INDEX "collection_image_position_idx";--> statement-breakpoint
CREATE INDEX "collection_image_position_idx" ON "collection_image" ("collection_id","position");