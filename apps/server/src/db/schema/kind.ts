import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** 公開サイトから送られた、固定ページの種類の定義のテーブル。 */
export const kind = pgTable("kind", {
  name: text("name").primaryKey(),
  label: text("label").notNull(),
  fields: jsonb("fields").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
