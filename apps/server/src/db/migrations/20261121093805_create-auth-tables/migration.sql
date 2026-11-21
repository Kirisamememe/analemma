CREATE TABLE "admin_user" (
	"id" smallint PRIMARY KEY DEFAULT 1,
	"user_handle" bytea NOT NULL UNIQUE,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "admin_user_single_row" CHECK ("id" = 1)
);
--> statement-breakpoint
CREATE TABLE "passkey_enrollment" (
	"id" text PRIMARY KEY,
	"secret_hash" bytea NOT NULL,
	"admin_user_id" smallint NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY,
	"admin_user_id" smallint NOT NULL,
	"name" text NOT NULL,
	"public_key" bytea NOT NULL,
	"algorithm" integer NOT NULL,
	"sign_count" bigint NOT NULL,
	"transports" text[] NOT NULL,
	"aaguid" uuid NOT NULL,
	"backup_eligible" boolean NOT NULL,
	"backed_up" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone NOT NULL,
	CONSTRAINT "passkey_sign_count_uint32" CHECK ("sign_count" between 0 and 4294967295)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"secret_hash" bytea NOT NULL,
	"admin_user_id" smallint NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "passkey_enrollment" ADD CONSTRAINT "passkey_enrollment_admin_user_id_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_admin_user_id_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_admin_user_id_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE;