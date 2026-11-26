import type { FieldDefinition, contentIssues } from "@analemma/contract";

import { isFormGroup } from "./is-form-group";

import type { ContentForm } from "@/features/fixed-pages/content-form";

type ContentIssue = ReturnType<typeof contentIssues.parse>[number];

type Submission = {
  /** 送ったときの種類の定義の項目。 */
  readonly fields: readonly FieldDefinition[];
  /** 送ったときのフォーム。 */
  readonly submitted: ContentForm;
};

type BoundIssue = {
  /** フォームの項目のキーと repeat の要素の ID の並び。 */
  readonly location: string[];
  /** 画像の選択ボタンに出す誤りか。 */
  readonly image?: true;
  /** この場所に結びつけた中身の issue。 */
  readonly issue: ContentIssue;
};

const findLocation = (
  submission: Submission,
  path: ContentIssue["path"],
): Omit<BoundIssue, "issue"> | undefined => {
  let { fields, submitted } = submission;
  const location: string[] = [];
  let offset = 0;

  while (offset < path.length) {
    const key = path[offset];
    const field = fields.find((candidate) => candidate.key === key);

    if (field === undefined) return undefined;

    location.push(field.key);
    offset += 1;

    if (offset === path.length) {
      return field.type === "image" ? { location, image: true } : { location };
    }

    const value = submitted.values[field.key];

    if (field.type === "group" && isFormGroup(value)) {
      submitted = value;
    } else if (field.type === "repeat" && Array.isArray(value)) {
      const index = path[offset];
      const item = typeof index === "number" ? value[index] : undefined;

      if (item === undefined) return undefined;

      location.push(item.id);
      submitted = item.value;
      offset += 1;
    } else {
      return undefined;
    }

    fields = field.fields;
  }

  return location.length > 0 ? { location } : undefined;
};

/** 中身の issue を、送ったときのフォームの場所に結びつける。 */
export const bindContentIssues = (
  submission: Submission,
  issues: readonly ContentIssue[],
) => {
  const bound: BoundIssue[] = [];
  const unbound: ContentIssue[] = [];

  for (const issue of issues) {
    const location = findLocation(submission, issue.path);

    if (location === undefined) {
      unbound.push(issue);
    } else {
      bound.push({ ...location, issue });
    }
  }

  return { bound, unbound };
};
