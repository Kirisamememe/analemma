import { reauthenticate } from "@/features/auth/current-session/reauthenticate";
import { issueSecretToken } from "@/features/auth/secret-token/secret-token";
import { recordIssue } from "@/features/deploy-tokens/queries/deploy-tokens.query";
import { toDeployTokenSummary } from "@/features/deploy-tokens/to-deploy-token-summary";
import { adminProcedures } from "@/procedures";

/** 今のパスキーで確かめ直してから、デプロイ用のトークンを発行し、1回だけ token を返す procedure。 */
export const issueDeployToken = adminProcedures.deployTokens.issue.handler(
  async ({ context, errors, input }) => {
    const sessionId = context.session.id;
    const reauthenticated = await reauthenticate(context, {
      action: "deployTokens.issue",
      assertion: input.assertion,
    });

    if (reauthenticated._tag === "Rejected") {
      throw errors.REAUTHENTICATION_FAILED();
    }

    const issued = await issueSecretToken();
    const recorded = await recordIssue(context.db, {
      reauthentication: { sessionId, use: reauthenticated.use },
      token: { id: issued.id, secretHash: issued.secretHash, name: input.name },
    });

    switch (recorded._tag) {
      case "SessionGone":
        throw errors.UNAUTHORIZED();
      case "PasskeyGone":
        throw errors.REAUTHENTICATION_FAILED();
      case "Issued":
        context.logger.write({
          level: "info",
          message: "デプロイ用のトークンを発行した",
          details: { deployTokenId: recorded.row.id, sessionId },
        });

        return { ...toDeployTokenSummary(recorded.row), token: issued.token };
    }
  },
);
