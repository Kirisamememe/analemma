import { bindContentIssues } from "../bind-content-issues";
import { toFixedPageContent } from "../to-fixed-page-content";
import {
  type EditorBase,
  type EditorValues,
  restoreContent,
} from "./flat-content";

import type { ApiClient, ApiInputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

type Create = ApiInputs["admin"]["fixedPages"]["create"];
type Update = ApiInputs["admin"]["fixedPages"]["update"];
type Submission = EditorBase & {
  /** 作成する種類か、編集する固定ページの ID。 */
  target: Pick<Create, "kind"> | Pick<Update, "id">;
  /** 送る時点のフォームの値。 */
  values: EditorValues;
};

const toInput = ({ fields, unknownKeys }: EditorBase, values: EditorValues) => {
  const submitted = restoreContent(fields, { ...values, unknownKeys });

  return {
    submitted,
    input: {
      slug: values.slug,
      title: values.title,
      content: toFixedPageContent(fields, submitted),
    },
  };
};

/** 固定ページを保存し、中身の誤りを送った時点の項目に結び付ける。 */
export const saveFixedPage = async (
  api: ApiClient,
  { target, values, ...base }: Submission,
) => {
  const { submitted, input } = toInput(base, values);

  const result =
    "id" in target
      ? await callApi(api.admin.fixedPages.update({ ...target, ...input }), [
          "SLUG_TAKEN",
          "INVALID_CONTENT",
          "NOT_FOUND",
        ])
      : await callApi(api.admin.fixedPages.create({ ...target, ...input }), [
          "SLUG_TAKEN",
          "INVALID_CONTENT",
          "UNKNOWN_KIND",
        ]);

  if (result._tag === "Succeeded") return result;

  const { error } = result;

  if (error.code === "INVALID_CONTENT") {
    return {
      _tag: "InvalidContent",
      issues: bindContentIssues(
        { fields: base.fields, submitted },
        error.data.issues,
      ),
    } as const;
  }

  return { _tag: error.code };
};

/** 比べるフォームの値。 */
type Comparison = {
  /** 開いたときか、最後に保存できたときの値。 */
  readonly saved: EditorValues;
  /** 今の値。 */
  readonly current: EditorValues;
};

/** 保存した値と今の値とで、保存で送る slug・タイトル・中身が違うか。 */
export const hasUnsavedChanges = (
  base: EditorBase,
  { saved, current }: Comparison,
): boolean =>
  JSON.stringify(toInput(base, saved).input) !==
  JSON.stringify(toInput(base, current).input);
