import type { KindDefinition } from "@analemma/contract";

import { type ContentIssue, checkContent } from "../check-content";
import type { KindPage } from "./list-kind-pages.query";

/** 新しい定義に合わない固定ページと、その理由。 */
export type IncompatiblePage = {
  /** 固定ページの種類の名前。 */
  readonly kind: string;
  /** 固定ページの ID。 */
  readonly id: string;
  /** 固定ページの slug。 */
  readonly slug: string;
  /** 固定ページのタイトル。 */
  readonly title: string;
  /** 合わない理由。 */
  readonly issues: ContentIssue[];
};

/** 確かめる固定ページと、送られた種類の定義。 */
export type CompatibilityCheck = {
  /** すでにある固定ページ。 */
  readonly pages: readonly KindPage[];
  /** 送られた種類の定義。 */
  readonly definitions: readonly KindDefinition[];
};

/** すでにある固定ページのうち、送られた定義に合わないものを選ぶ。 */
export const findIncompatiblePages = ({
  definitions,
  pages,
}: CompatibilityCheck): IncompatiblePage[] => {
  const fieldsByKind = new Map(
    definitions.map(({ fields, name }) => [name, fields]),
  );

  return pages.flatMap((page) => {
    const fields = fieldsByKind.get(page.kind);

    if (fields === undefined) {
      return [];
    }

    const checked = checkContent({ fields, content: page.content });

    return checked._tag === "Valid"
      ? []
      : [
          {
            kind: page.kind,
            id: page.id,
            slug: page.slug,
            title: page.title,
            issues: checked.issues,
          },
        ];
  });
};
