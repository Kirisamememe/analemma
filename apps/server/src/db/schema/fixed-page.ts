import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { kind } from "@/db/schema/kind";

/** 固定ページのテーブル。 */
export const fixedPage = pgTable(
  "fixed_page",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    kind: text("kind")
      .notNull()
      .references(() => kind.name),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    content: jsonb("content").notNull(),
    position: integer("position").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("fixed_page_kind_idx").on(table.kind)],
);
