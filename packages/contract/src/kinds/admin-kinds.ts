import { z } from "zod";

import { adminAccess } from "../access-errors";
import { displayLabel, fieldDefinitions } from "./field-definition";
import { kindName } from "./kind-definition";

const kindSummary = z.object({
  name: kindName,
  label: displayLabel,
  createdAt: z.iso.datetime({ offset: true }).describe("最初に送られた日時。"),
  updatedAt: z.iso
    .datetime({ offset: true })
    .describe("定義が最後に変わった日時。"),
});

/** 管理画面が種類を読む procedure の contract。 */
export const kinds = {
  list: adminAccess
    .route({ method: "GET", path: "/admin/kinds", summary: "種類の一覧" })
    .output(z.object({ kinds: z.array(kindSummary) })),
  get: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/admin/kinds/{name}",
      summary: "種類の定義",
    })
    .input(z.object({ name: kindName }))
    .output(kindSummary.extend({ fields: fieldDefinitions })),
};
