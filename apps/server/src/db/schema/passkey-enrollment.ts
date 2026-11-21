import { pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { adminUser } from "./admin-user";
import { bytes } from "./bytes";

/** 1回きりの登録用 URL の token のテーブル。 */
export const passkeyEnrollment = pgTable("passkey_enrollment", {
  id: text("id").primaryKey(),
  secretHash: bytes("secret_hash").notNull(),
  adminUserId: smallint("admin_user_id")
    .notNull()
    .references(() => adminUser.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
