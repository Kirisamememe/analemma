CREATE TABLE "kind" (
	"name" text PRIMARY KEY,
	"label" text NOT NULL,
	"fields" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
