import { z } from "zod";

import { kindName } from "../kinds/kind-definition";

const isWellFormed = (value: string): boolean => value.isWellFormed();

/** 固定ページの ID。 */
export const fixedPageId = z.uuid().describe("固定ページの ID。");

/** 固定ページの slug。 */
export const fixedPageSlug = z
  .string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/v, {
    error: "英小文字・数字・ハイフンで書く",
  })
  .describe("公開サイトが固定ページを引く名前(kebab-case)。");

/** 固定ページのタイトル。 */
export const fixedPageTitle = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^\P{Cc}*$/v, { error: "改行と制御文字は使えない" })
  .refine(isWellFormed, { error: "対になっていないサロゲートは使えない" })
  .describe("固定ページのタイトル。");

/** 固定ページの中身で、項目のキーと値の組。 */
export const fixedPageContent = z
  .record(z.string(), z.json())
  .describe("種類の定義に合う、項目のキーと値の組。");

/** 固定ページの中身の型。 */
export type FixedPageContent = z.output<typeof fixedPageContent>;

/** 管理画面に返す、固定ページの一覧の1件。 */
export const fixedPageSummary = z.object({
  id: fixedPageId,
  kind: kindName,
  slug: fixedPageSlug,
  title: fixedPageTitle,
  published: z.boolean().describe("公開しているか。"),
  publishedAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .describe("公開した日時。公開していなければ null。"),
  position: z.int().describe("並び順。小さいほど前。"),
  createdAt: z.iso.datetime({ offset: true }).describe("作った日時。"),
  updatedAt: z.iso
    .datetime({ offset: true })
    .describe("タイトル・slug・中身を最後に変えた日時。"),
});

/** 管理画面に返す、中身を含む固定ページ。 */
export const fixedPageDetail = fixedPageSummary.extend({
  content: fixedPageContent,
});
