import { deleteDeployToken } from "@/features/deploy-tokens/deploy-tokens.query";
import { adminProcedures } from "@/procedures";

/** デプロイ用のトークンを取り消す procedure。 */
export const revokeDeployToken = adminProcedures.deployTokens.revoke.handler(
  async ({ context, errors, input }) => {
    if (!(await deleteDeployToken(context.db, input.id))) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "デプロイ用のトークンを取り消した",
      details: { deployTokenId: input.id },
    });
  },
);
