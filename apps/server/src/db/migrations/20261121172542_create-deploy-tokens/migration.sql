CREATE TABLE "deploy_token" (
	"id" text PRIMARY KEY,
	"secret_hash" bytea NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone
);
