import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { image } from "@/db/schema/image";

/** 画像に付けるタグ。 */
export const imageTag = pgTable("image_tag", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  name: text("name").notNull().unique(),
  position: integer("position").notNull(),
});

/** 画像とタグの関連。 */
export const imageTagAssignment = pgTable(
  "image_tag_assignment",
  {
    imageId: uuid("image_id")
      .notNull()
      .references(() => image.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => imageTag.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.imageId, table.tagId] }),
    index("image_tag_assignment_tag_image_idx").on(table.tagId, table.imageId),
  ],
);
