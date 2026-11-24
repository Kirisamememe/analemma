import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

/** Dropbox との接続の行を指す、ただ1つの ID。 */
export const DROPBOX_CONNECTION_ID = 1;

/** 行を1つに限った、Dropbox との接続のテーブル。 */
export const dropboxConnection = pgTable(
  "dropbox_connection",
  {
    id: smallint("id").primaryKey().default(DROPBOX_CONNECTION_ID),
    accountId: text("account_id").notNull(),
    accountName: text("account_name").notNull(),
    accountEmail: text("account_email").notNull(),
    refreshToken: text("refresh_token").notNull(), // 更新には app secret も要る
    connectedAt: timestamp("connected_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "dropbox_connection_single_row",
      sql`${table.id} = ${sql.raw(String(DROPBOX_CONNECTION_ID))}`,
    ),
  ],
);
