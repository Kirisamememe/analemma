import { eq, sql } from "drizzle-orm";

import { image } from "@/db/schema/image";
import type { ImageRow } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 書き換える画像の、タイトル・説明・alt。 */
export type ImageTextChange = {
  /** 画像の ID。 */
  readonly id: string;
  /** タイトル。 */
  readonly title: string | null;
  /** 説明。 */
  readonly description: string | null;
  /** alt。 */
  readonly alt: string | null;
  /** 書き換えた日時。 */
  readonly now: Date;
};

/** 画像のタイトル・説明・alt を書き換え、書き換えた行を返す。 */
export const updateImageText = async (
  db: DatabaseExecutor,
  { alt, description, id, now, title }: ImageTextChange,
): Promise<ImageRow | undefined> => {
  const [row] = await db
    .update(image)
    .set({
      title,
      description,
      alt,
      updatedAt: sql`case
        when ${image.title} is distinct from ${title}::text
          or ${image.description} is distinct from ${description}::text
          or ${image.alt} is distinct from ${alt}::text
        then ${now}::timestamptz
        else ${image.updatedAt}
      end`,
    })
    .where(eq(image.id, id))
    .returning();

  return row;
};
