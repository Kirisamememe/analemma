import type { ContentIssue } from "@analemma/contract";

import type { bindContentIssues } from "../bind-content-issues";

import type { MessageKey } from "@/i18n/use-translate";

const issueMessage = (code: string): MessageKey => {
  switch (code) {
    case "invalid_type":
      return "fixedPages.issue.type";
    case "invalid_format":
      return "fixedPages.issue.format";
    case "invalid_value":
      return "fixedPages.issue.choice";
    case "too_big":
      return "fixedPages.issue.large";
    case "too_small":
      return "fixedPages.issue.small";
    default:
      return "fixedPages.issue.other";
  }
};

/** 入力欄とフォーム全体に出す、訳した誤りの知らせ。 */
export type EditorErrors = {
  /** 項目の場所ごとの知らせ。 */
  fields: Record<string, string>;
  /** フォーム全体の知らせ。 */
  notice?: string;
};

/** 中身の issue を項目ごとにまとめ、結べないものには server の返した場所を添える。 */
export const contentErrors = (
  issues: ReturnType<typeof bindContentIssues>,
  t: (key: MessageKey) => string,
): EditorErrors => {
  const fields: Record<string, string> = {};
  const translate = (issue: ContentIssue) => t(issueMessage(issue.code));

  for (const { location, issue } of issues.bound) {
    const name = "content." + location.join("/");
    fields[name] = [fields[name], translate(issue)].filter(Boolean).join(" ");
  }

  if (issues.unbound.length === 0 && issues.bound.length > 0) return { fields };

  const messages = issues.unbound.map((issue) =>
    [issue.path.join("/"), translate(issue)].filter(Boolean).join(" — "),
  );

  return {
    fields,
    notice: [t("fixedPages.changedKind"), ...messages].join(" "),
  };
};

/** 値が変わった項目と、その値を含む group や repeat の知らせを消す。 */
export const clearChangedErrors = (
  errors: EditorErrors,
  name: string,
): EditorErrors => {
  const entries = Object.entries(errors.fields);
  const remaining = entries.filter(
    ([key]) => key !== name && !name.startsWith(key + "/"),
  );

  return entries.length === remaining.length
    ? errors
    : { ...errors, fields: Object.fromEntries(remaining) };
};
