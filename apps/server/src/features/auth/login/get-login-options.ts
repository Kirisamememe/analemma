import { authProcedures } from "../../../procedures";
import { createLoginOptions } from "./create-login-options";

/** パスキーでログインするための options を返す procedure。 */
export const getLoginOptions = authProcedures.login.options.handler(
  ({ context }) =>
    createLoginOptions(
      context.challenges.issue({ kind: "login" }, context.clock.now()),
      context.relyingParty.rpId,
    ),
);
