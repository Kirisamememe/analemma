import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { image } from "@/db/schema/image";

/** シリーズのテーブル。 */
export const series = pgTable("series", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

/** シリーズの中の画像と並び順。 */
export const seriesImage = pgTable(
  "series_image",
  {
    seriesId: uuid("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => image.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.seriesId, table.imageId] }),
    index("series_image_position_idx").on(table.seriesId, table.position),
    index("series_image_image_idx").on(table.imageId),
  ],
);
