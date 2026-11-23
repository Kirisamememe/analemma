CREATE TABLE "dropbox_connection" (
	"id" smallint PRIMARY KEY DEFAULT 1,
	"account_id" text NOT NULL,
	"account_name" text NOT NULL,
	"account_email" text NOT NULL,
	"refresh_token" text NOT NULL,
	"connected_at" timestamp with time zone NOT NULL,
	CONSTRAINT "dropbox_connection_single_row" CHECK ("id" = 1)
);
