import { createLoginOptions } from "@/features/auth/login/create-login-options";
import { adminProcedures } from "@/procedures";

/** 今のパスキーで確かめ直すための、再認証の options を返す procedure。 */
export const getReauthenticationOptions =
  adminProcedures.session.reauthenticationOptions.handler(({ context }) =>
    createLoginOptions(
      context.challenges.issue(
        { kind: "reauthentication", sessionId: context.session.id },
        context.clock.now(),
      ),
      context.relyingParty.rpId,
    ),
  );
