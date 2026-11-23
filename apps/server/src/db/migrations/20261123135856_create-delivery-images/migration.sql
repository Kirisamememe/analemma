CREATE TABLE "delivery_image" (
	"image_id" uuid,
	"width" integer,
	"height" integer NOT NULL,
	"file_key" text NOT NULL UNIQUE,
	CONSTRAINT "delivery_image_pkey" PRIMARY KEY("image_id","width"),
	CONSTRAINT "delivery_image_size_check" CHECK ("width" > 0 and "height" > 0)
);
--> statement-breakpoint
ALTER TABLE "delivery_image" ADD CONSTRAINT "delivery_image_image_id_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE;