import { pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { bytes } from "@/db/bytes";
import { adminUser } from "@/db/schema/auth/admin-user";

/** 管理者のログインのセッションのテーブル。 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  secretHash: bytes("secret_hash").notNull(),
  adminUserId: smallint("admin_user_id")
    .notNull()
    .references(() => adminUser.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull(),
});
