import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** 画像の状態(変換中・読めない写真・変換の中断・非公開・公開)。 */
export const imageStatus = pgEnum("image_status", [
  "processing",
  "unreadable",
  "interrupted",
  "unpublished",
  "published",
]);

/** 画像(写真作品を兼ねる)のテーブル。 */
export const image = pgTable(
  "image",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    title: text("title"),
    description: text("description"),
    alt: text("alt"),
    takenAt: timestamp("taken_at", { mode: "string" }), // 時差を含まない現地の日時
    takenAtOffsetMinutes: smallint("taken_at_offset_minutes"),
    camera: text("camera"),
    lens: text("lens"),
    focalLength: doublePrecision("focal_length"), // mm
    fNumber: doublePrecision("f_number"),
    exposureTime: doublePrecision("exposure_time"), // 秒
    iso: integer("iso"),
    status: imageStatus("status").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "image_published_at_check",
      sql`(${table.status} = 'published') = (${table.publishedAt} is not null)`,
    ),
    check(
      "image_taken_at_offset_check",
      sql`${table.takenAtOffsetMinutes} is null or (${table.takenAt} is not null and ${table.takenAtOffsetMinutes} between -1080 and 1080)`,
    ),
  ],
);
