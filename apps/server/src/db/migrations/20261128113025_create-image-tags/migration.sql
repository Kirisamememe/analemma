CREATE TABLE "image_tag" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL UNIQUE,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_tag_assignment" (
	"image_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "image_tag_assignment_pkey" PRIMARY KEY("image_id","tag_id")
);
--> statement-breakpoint
CREATE INDEX "image_tag_assignment_tag_image_idx" ON "image_tag_assignment" ("tag_id","image_id");--> statement-breakpoint
ALTER TABLE "image_tag_assignment" ADD CONSTRAINT "image_tag_assignment_image_id_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "image_tag_assignment" ADD CONSTRAINT "image_tag_assignment_tag_id_image_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "image_tag"("id") ON DELETE RESTRICT;