import { adminProcedures } from "../../procedures";
import { issueSecretToken } from "../auth/secret-token/issue-secret-token";
import { insertDeployToken } from "./insert-deploy-token.query";
import { toDeployTokenSummary } from "./to-deploy-token-summary";

/** デプロイ用のトークンを発行し、1回だけ token を返す procedure。 */
export const issueDeployToken = adminProcedures.deployTokens.issue.handler(
  async ({ context, input }) => {
    const issued = await issueSecretToken();
    const row = await insertDeployToken(context.db, {
      id: issued.id,
      secretHash: issued.secretHash,
      name: input.name,
      now: context.clock.now(),
    });

    context.logger.write({
      level: "info",
      message: "デプロイ用のトークンを発行した",
      details: { deployTokenId: row.id },
    });

    return { ...toDeployTokenSummary(row), token: issued.token };
  },
);
