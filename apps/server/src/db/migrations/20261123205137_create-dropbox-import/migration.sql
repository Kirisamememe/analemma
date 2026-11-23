CREATE TABLE "dropbox_import" (
	"content_hash" text PRIMARY KEY,
	"file_id" text NOT NULL,
	"path" text NOT NULL,
	"image_id" uuid,
	"imported_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dropbox_import" ADD CONSTRAINT "dropbox_import_image_id_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE SET NULL;