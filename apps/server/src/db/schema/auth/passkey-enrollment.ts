import { pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { bytes } from "@/db/bytes";
import { adminUser } from "@/db/schema/auth/admin-user";

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
