import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { image } from "@/db/schema/image";

/** 画像を幅の段ごとに変換した、配信用の画像(AVIF)のテーブル。 */
export const deliveryImage = pgTable(
  "delivery_image",
  {
    imageId: uuid("image_id")
      .notNull()
      .references(() => image.id, { onDelete: "cascade" }),
    width: integer("width").notNull(), // px
    height: integer("height").notNull(), // px
    fileKey: text("file_key").notNull().unique(), // 置き場所の中のファイルの名前
  },
  (table) => [
    primaryKey({ columns: [table.imageId, table.width] }),
    check(
      "delivery_image_size_check",
      sql`${table.width} > 0 and ${table.height} > 0`,
    ),
  ],
);
