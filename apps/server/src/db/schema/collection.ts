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

/** 作品集のテーブル。 */
export const collection = pgTable("collection", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

/** 作品集の中の画像と並び順。 */
export const collectionImage = pgTable(
  "collection_image",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collection.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => image.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.imageId] }),
    index("collection_image_position_idx").on(
      table.collectionId,
      table.position,
    ),
    index("collection_image_image_idx").on(table.imageId),
  ],
);
