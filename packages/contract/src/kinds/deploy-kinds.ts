import { z } from "zod";

import { deployAccess } from "../access-errors";
import { contentIssues } from "./content-issues";
import { kindDefinitionList, kindName } from "./kind-definition";

const incompatiblePage = z.object({
  kind: kindName,
  id: z.uuid().describe("固定ページの ID。"),
  slug: z.string().describe("固定ページの slug。"),
  title: z.string().describe("固定ページのタイトル。"),
  issues: contentIssues,
});

const kindChange = z.object({
  name: kindName,
  change: z
    .enum(["created", "updated", "unchanged"])
    .describe("送った定義で、種類がどう変わったか。"),
});

/** デプロイのときに、公開サイトの種類の定義を送る procedure の contract。 */
export const deployKinds = {
  push: deployAccess
    .errors({
      INCOMPATIBLE_PAGES: {
        status: 409,
        data: z.object({ pages: z.array(incompatiblePage) }),
      },
    })
    .route({
      method: "POST",
      path: "/deploy/kinds",
      summary: "種類の定義を送る",
    })
    .input(z.object({ kinds: kindDefinitionList }))
    .output(z.object({ kinds: z.array(kindChange) })),
};
