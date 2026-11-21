import type { z } from "zod";

import {
  type FieldDefinition,
  type contentIssues,
  toContentSchema,
} from "@analemma/contract";

/** 中身が種類の定義に合わない理由の1件。 */
export type ContentIssue = z.output<typeof contentIssues>[number];

/** 種類の定義に合った中身。 */
export type ValidContent = {
  /** 結果の種類。 */
  readonly _tag: "Valid";
  /** 定義に無いキーも残した、検査した中身。 */
  readonly content: Record<string, unknown>;
};

/** 種類の定義に合わない中身と、その理由。 */
export type InvalidContent = {
  /** 結果の種類。 */
  readonly _tag: "Invalid";
  /** 合わない理由(先頭の20件まで)。 */
  readonly issues: ContentIssue[];
};

/** 検査する中身と、種類の項目の定義。 */
export type ContentCheck = {
  /** 種類の直下の項目の定義。 */
  readonly fields: readonly FieldDefinition[];
  /** 検査する中身。 */
  readonly content: unknown;
};

const MAX_ISSUES = 20;

/** 種類の定義から、中身を定義に無いキーを残したまま確かめる関数を作る。 */
export const createContentCheck = (
  fields: readonly FieldDefinition[],
): ((content: unknown) => ValidContent | InvalidContent) => {
  const schema = toContentSchema({ fields, unknownKeys: "keep" });

  return (content) => {
    const result = schema.safeParse(content);

    if (result.success) {
      return { _tag: "Valid", content: result.data };
    }

    return {
      _tag: "Invalid",
      issues: result.error.issues
        .slice(0, MAX_ISSUES)
        .map(({ code, message, path }) => ({
          path: path.map((key) =>
            typeof key === "symbol" ? String(key) : key,
          ),
          code,
          message,
        })),
    };
  };
};

/** 中身が種類の定義に合うかを、定義に無いキーを残したまま確かめる。 */
export const checkContent = ({
  content,
  fields,
}: ContentCheck): ValidContent | InvalidContent =>
  createContentCheck(fields)(content);
