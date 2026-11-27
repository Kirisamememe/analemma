import { and, eq, inArray, sql } from "drizzle-orm";

import { image } from "@/db/schema/image";
import type { ImageRow } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 公開するか非公開にするかと、その日時。 */
export type PublishChange = {
  /** 画像の ID。 */
  readonly id: string;
  /** 公開するなら true、非公開にするなら false。 */
  readonly published: boolean;
  /** 操作した日時。 */
  readonly now: Date;
};

/** 変換を終えた画像を公開するか非公開にし、書き換えた行を返す。 */
export const setPublished = async (
  db: DatabaseExecutor,
  { id, now, published }: PublishChange,
): Promise<ImageRow | undefined> => {
  const [row] = await db
    .update(image)
    .set(
      published
        ? {
            status: "published",
            publishedAt: sql`coalesce(${image.publishedAt}, ${now})`,
          }
        : { status: "unpublished", publishedAt: null },
    )
    .where(
      and(
        eq(image.id, id),
        inArray(image.status, ["unpublished", "published"]),
      ),
    )
    .returning();

  return row;
};
