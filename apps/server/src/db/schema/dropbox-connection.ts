import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { bytes } from "@/db/bytes";

/** Dropbox とのつながり(1行だけ)のテーブル。 */
export const dropboxConnection = pgTable(
  "dropbox_connection",
  {
    id: smallint("id").primaryKey().default(1),
    accountId: text("account_id").notNull(),
    refreshToken: bytes("refresh_token").notNull(), // AES-GCM の iv と暗号
    connectedAt: timestamp("connected_at", { withTimezone: true }).notNull(),
  },
  (table) => [check("dropbox_connection_single_check", sql`${table.id} = 1`)],
);
