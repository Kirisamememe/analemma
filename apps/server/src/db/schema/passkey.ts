import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { adminUser } from "@/db/schema/admin-user";
import { bytes } from "@/db/schema/bytes";

/** 管理者のパスキーのテーブル。 */
export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    adminUserId: smallint("admin_user_id")
      .notNull()
      .references(() => adminUser.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    publicKey: bytes("public_key").notNull(),
    algorithm: integer("algorithm").notNull(),
    signCount: bigint("sign_count", { mode: "number" }).notNull(),
    transports: text("transports").array().notNull(),
    aaguid: uuid("aaguid").notNull(),
    backupEligible: boolean("backup_eligible").notNull(),
    backedUp: boolean("backed_up").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "passkey_sign_count_uint32",
      sql`${table.signCount} between 0 and 4294967295`,
    ),
  ],
);
