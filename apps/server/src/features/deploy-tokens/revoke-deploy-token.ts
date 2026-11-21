import { adminProcedures } from "../../procedures";
import { deleteDeployToken } from "./delete-deploy-token.query";

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
