import { asc, inArray } from "drizzle-orm";

import { fixedPage } from "@/db/schema/fixed-page";
import type { DatabaseExecutor } from "@/platform/database";

/** 定義を確かめ直す、固定ページの中身。 */
export type KindPage = {
  /** 固定ページの ID。 */
  readonly id: string;
  /** 固定ページの種類の名前。 */
  readonly kind: string;
  /** 固定ページの slug。 */
  readonly slug: string;
  /** 固定ページのタイトル。 */
  readonly title: string;
  /** 固定ページの中身。 */
  readonly content: unknown;
};

/** 種類ごとに、その種類の固定ページを並べる。 */
export const listKindPages = async (
  db: DatabaseExecutor,
  kinds: readonly string[],
): Promise<KindPage[]> => {
  if (kinds.length === 0) {
    return [];
  }

  return db
    .select({
      id: fixedPage.id,
      kind: fixedPage.kind,
      slug: fixedPage.slug,
      title: fixedPage.title,
      content: fixedPage.content,
    })
    .from(fixedPage)
    .where(inArray(fixedPage.kind, [...kinds]))
    .orderBy(asc(fixedPage.kind), asc(fixedPage.position), asc(fixedPage.id));
};
