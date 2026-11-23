import { bindContentIssues } from "../../logic/bind-content-issues";
import type { EditorBase, EditorValues } from "../logic/flat-content";
import { toSaveInput } from "../logic/save-input";

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

/** 固定ページを保存し、中身の誤りを送った時点の項目に結び付ける。 */
export const saveFixedPage = async (
  api: ApiClient,
  { target, values, ...base }: Submission,
) => {
  const { submitted, input } = toSaveInput(base, values);
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
