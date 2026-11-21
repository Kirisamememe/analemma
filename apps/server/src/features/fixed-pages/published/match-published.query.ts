import { type SQL, isNotNull } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";

/** 公開状態を決める、固定ページの列。 */
export type PublishState = {
  /** 公開した日時か null。 */
  readonly publishedAt: Date | null;
};

/** 固定ページを、公開サイトに見せてよいかを決める。 */
export const isPublished = ({ publishedAt }: PublishState): boolean =>
  publishedAt !== null;

/** 公開サイトに見せてよい固定ページだけを選ぶ、SQL の条件。 */
export const matchPublished = (): SQL => isNotNull(fixedPage.publishedAt);
