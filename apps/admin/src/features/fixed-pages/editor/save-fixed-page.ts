import type { FieldDefinition } from "@analemma/contract";

import { bindContentIssues } from "../bind-content-issues";
import type { ContentForm } from "../content-form";
import { toFixedPageContent } from "../to-fixed-page-content";

import type { ApiClient, ApiInputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

type Create = ApiInputs["admin"]["fixedPages"]["create"];
type Update = ApiInputs["admin"]["fixedPages"]["update"];
type Submission = Pick<Create, "slug" | "title"> & {
  /** 作成する種類か、編集する固定ページの ID。 */
  target: Pick<Create, "kind"> | Pick<Update, "id">;
  /** 送る時点の種類の定義の項目。 */
  fields: readonly FieldDefinition[];
  /** 送る時点のフォーム。 */
  submitted: ContentForm;
};

/** 固定ページを保存し、中身の誤りを送った時点の項目に結び付ける。 */
export const saveFixedPage = async (
  api: ApiClient,
  { target, slug, title, fields, submitted }: Submission,
) => {
  const input = { slug, title, content: toFixedPageContent(fields, submitted) };
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
      issues: bindContentIssues({ fields, submitted }, error.data.issues),
    } as const;
  }

  return { _tag: error.code };
};
