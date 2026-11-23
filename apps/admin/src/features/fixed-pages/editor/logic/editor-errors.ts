import type { ContentIssue } from "@analemma/contract";

import type { bindContentIssues } from "../../logic/bind-content-issues";
import type { saveFixedPage } from "../queries/save-fixed-page";

import type { MessageKey, useTranslate } from "@/i18n/use-translate";

const issueMessage = (code: string): MessageKey => {
  switch (code) {
    case "invalid_type":
      return "fixedPageEditor.issue.type";
    case "invalid_format":
      return "fixedPageEditor.issue.format";
    case "invalid_value":
      return "fixedPageEditor.issue.choice";
    case "too_big":
      return "fixedPageEditor.issue.large";
    case "too_small":
      return "fixedPageEditor.issue.small";
    default:
      return "fixedPageEditor.issue.other";
  }
};

/** 入力欄とフォーム全体に出す、訳した誤りの知らせ。 */
export type EditorErrors = {
  /** slug・タイトルと、中身の場所ごとの知らせ。 */
  fields: Record<string, string>;
  /** フォーム全体の知らせ。 */
  notice?: string;
};

/** 中身の issue を項目ごとにまとめ、結べないものには server の返した場所を添える。 */
export const contentErrors = (
  issues: ReturnType<typeof bindContentIssues>,
  t: ReturnType<typeof useTranslate>,
): EditorErrors => {
  const fields: Record<string, string> = {};
  const translate = (issue: ContentIssue) => t(issueMessage(issue.code));

  for (const { location, issue } of issues.bound) {
    const name = "content." + location.join("/");
    const message = translate(issue);
    const previous = fields[name];

    fields[name] =
      previous === undefined || previous.includes(message)
        ? message
        : previous + " " + message;
  }

  if (issues.unbound.length === 0 && issues.bound.length > 0) return { fields };

  const messages = issues.unbound.map((issue) =>
    t("fixedPageEditor.unboundIssue", {
      path: issue.path.join("/"),
      message: translate(issue),
    }),
  );

  return {
    fields,
    notice: [t("fixedPageEditor.changedKind"), ...messages].join(" "),
  };
};

/** server が断った保存の結果。 */
type Refused = Exclude<
  Awaited<ReturnType<typeof saveFixedPage>>,
  {
    /** どの結果か。 */
    readonly _tag: "Succeeded";
  }
>;

/** server が断った保存の結果を、入力欄とフォーム全体の知らせにする。 */
export const refusedSaveErrors = (
  result: Refused,
  t: ReturnType<typeof useTranslate>,
): EditorErrors => {
  switch (result._tag) {
    case "SLUG_TAKEN":
      return { fields: { slug: t("fixedPageEditor.slugTaken") } };
    case "InvalidContent":
      return contentErrors(result.issues, t);
    case "NOT_FOUND":
      return { fields: {}, notice: t("fixedPageEditor.pageGone") };
    case "UNKNOWN_KIND":
      return { fields: {}, notice: t("fixedPageEditor.kindGone") };
  }
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
