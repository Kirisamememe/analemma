import { listDeployTokens as listDeployTokenRows } from "@/features/deploy-tokens/queries/deploy-tokens.query";
import { toDeployTokenSummary } from "@/features/deploy-tokens/to-deploy-token-summary";
import { adminProcedures } from "@/procedures";

/** デプロイ用のトークンの一覧を返す procedure。 */
export const listDeployTokens = adminProcedures.deployTokens.list.handler(
  async ({ context }) => ({
    tokens: (await listDeployTokenRows(context.db)).map((row) =>
      toDeployTokenSummary(row),
    ),
  }),
);
