import { sql } from "drizzle-orm";
import { check, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { bytes } from "@/db/schema/bytes";

/** 管理者の行を指す、ただ1つの ID。 */
export const ADMIN_USER_ID = 1;

/** 行を1つに限った、管理者のテーブル。 */
export const adminUser = pgTable(
  "admin_user",
  {
    id: smallint("id").primaryKey().default(ADMIN_USER_ID),
    userHandle: bytes("user_handle").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "admin_user_single_row",
      sql`${table.id} = ${sql.raw(String(ADMIN_USER_ID))}`,
    ),
  ],
);
