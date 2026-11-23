CREATE TABLE "image" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"title" text,
	"description" text,
	"alt" text,
	"taken_at" timestamp,
	"taken_at_offset_minutes" smallint,
	"camera" text,
	"lens" text,
	"focal_length" double precision,
	"f_number" double precision,
	"exposure_time" double precision,
	"iso" integer,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "image_taken_at_offset_check" CHECK ("taken_at_offset_minutes" is null or ("taken_at" is not null and "taken_at_offset_minutes" between -1080 and 1080))
);
