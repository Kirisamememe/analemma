ALTER TYPE "image_status" RENAME VALUE 'failed' TO 'unreadable';--> statement-breakpoint
ALTER TYPE "image_status" ADD VALUE 'interrupted' AFTER 'unreadable';
