import { createLoginOptions } from "@/features/auth/login/create-login-options";
import { authProcedures } from "@/procedures";

/** パスキーでログインするための options を返す procedure。 */
export const getLoginOptions = authProcedures.login.options.handler(
  ({ context }) =>
    createLoginOptions(
      context.challenges.issue({ kind: "login" }, context.clock.now()),
      context.relyingParty.rpId,
    ),
);
