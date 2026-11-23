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

/** 入力欄ごとの、訳した誤りの知らせ。 */
export type FieldErrors = Record<string, string>;

/** server が断った保存から作る、入力欄の知らせと、失敗の Toast の文。 */
export type RefusedSave = {
  /** slug・タイトルと、中身の場所ごとの知らせ。 */
  fields: FieldErrors;
  /** 失敗の Toast に出す文。 */
  message: string;
};

/** 中身の issue を項目ごとにまとめ、結べないものは server の返した場所を添えて Toast の文にする。 */
export const contentErrors = (
  issues: ReturnType<typeof bindContentIssues>,
  t: ReturnType<typeof useTranslate>,
): RefusedSave => {
  const fields: FieldErrors = {};
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

  if (issues.unbound.length === 0 && issues.bound.length > 0) {
    return { fields, message: t("fixedPageEditor.invalidContent") };
  }

  const messages = issues.unbound.map((issue) =>
    t("fixedPageEditor.unboundIssue", {
      path: issue.path.join("/"),
      message: translate(issue),
    }),
  );

  return {
    fields,
    message: [t("fixedPageEditor.changedKind"), ...messages].join(" "),
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

/** server が断った保存の結果を、入力欄の知らせと失敗の Toast の文にする。 */
export const refusedSaveErrors = (
  result: Refused,
  t: ReturnType<typeof useTranslate>,
): RefusedSave => {
  switch (result._tag) {
    case "SLUG_TAKEN":
      return {
        fields: { slug: t("fixedPageEditor.slugTaken") },
        message: t("fixedPageEditor.slugTaken"),
      };
    case "InvalidContent":
      return contentErrors(result.issues, t);
    case "NOT_FOUND":
      return { fields: {}, message: t("fixedPageEditor.pageGone") };
    case "UNKNOWN_KIND":
      return { fields: {}, message: t("fixedPageEditor.kindGone") };
  }
};

/** 値が変わった項目と、その値を含む group や repeat の知らせを消す。 */
export const clearChangedErrors = (
  fields: FieldErrors,
  name: string,
): FieldErrors => {
  const entries = Object.entries(fields);
  const remaining = entries.filter(
    ([key]) => key !== name && !name.startsWith(key + "/"),
  );

  return entries.length === remaining.length
    ? fields
    : Object.fromEntries(remaining);
};
