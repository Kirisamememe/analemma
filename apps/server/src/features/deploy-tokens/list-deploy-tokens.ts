import { adminProcedures } from "../../procedures";
import { listDeployTokens as listDeployTokenRows } from "./deploy-tokens.query";
import { toDeployTokenSummary } from "./to-deploy-token-summary";

/** デプロイ用のトークンの一覧を返す procedure。 */
export const listDeployTokens = adminProcedures.deployTokens.list.handler(
  async ({ context }) => ({
    tokens: (await listDeployTokenRows(context.db)).map((row) =>
      toDeployTokenSummary(row),
    ),
  }),
);
