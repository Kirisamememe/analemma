import { pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { adminUser } from "./admin-user";
import { bytes } from "./bytes";

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
