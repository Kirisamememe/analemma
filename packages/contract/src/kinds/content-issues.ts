import { z } from "zod";

/** 中身が種類の定義に合わない理由の1件。 */
export const contentIssue = z.object({
  path: z
    .array(z.union([z.string(), z.number()]))
    .describe("合わない値の場所。キーと配列の添え字の並び。"),
  code: z.string().describe("zod の issue の code。"),
  message: z.string().describe("合わない理由(英語)。"),
});

/** 中身が種類の定義に合わない理由の型。 */
export type ContentIssue = z.output<typeof contentIssue>;

/** 中身が種類の定義に合わない理由の並び。 */
export const contentIssues = z.array(contentIssue);
