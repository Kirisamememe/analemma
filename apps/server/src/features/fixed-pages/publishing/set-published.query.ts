import { eq, sql } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../../platform/database";
import type { FixedPageRow } from "../fixed-pages.query";

/** 公開するか非公開に戻すかと、その日時。 */
export type PublishChange = {
  /** 固定ページの ID。 */
  readonly id: string;
  /** 公開するなら true、非公開に戻すなら false。 */
  readonly published: boolean;
  /** 操作した日時。 */
  readonly now: Date;
};

/** 固定ページを公開するか非公開に戻し、書き換えた行を返す。 */
export const setPublished = async (
  db: DatabaseExecutor,
  { id, now, published }: PublishChange,
): Promise<FixedPageRow | undefined> => {
  const [row] = await db
    .update(fixedPage)
    .set({
      publishedAt: published
        ? sql`coalesce(${fixedPage.publishedAt}, ${now})`
        : null,
    })
    .where(eq(fixedPage.id, id))
    .returning();

  return row;
};
