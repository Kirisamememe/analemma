import { z } from "zod";

import { deployAccess } from "../access-errors";
import { kindDefinitionList, kindName } from "./kind-definition";

const kindChange = z.object({
  name: kindName,
  change: z
    .enum(["created", "updated", "unchanged"])
    .describe("送った定義で、種類がどう変わったか。"),
});

/** デプロイのときに、公開サイトの種類の定義を送る procedure の contract。 */
export const deployKinds = {
  push: deployAccess
    .route({
      method: "POST",
      path: "/deploy/kinds",
      summary: "種類の定義を送る",
    })
    .input(z.object({ kinds: kindDefinitionList }))
    .output(z.object({ kinds: z.array(kindChange) })),
};
