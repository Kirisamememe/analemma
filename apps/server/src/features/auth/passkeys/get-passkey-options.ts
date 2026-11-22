import { adminProcedures } from "../../../procedures";
import { findAdminUser } from "../admin-user/admin-user.query";
import { createRegistrationOptions } from "../registration/create-registration-options";
import { listPasskeys } from "./list-passkeys.query";

/** パスキーを足すための、登録の options を返す procedure。 */
export const getPasskeyOptions =
  adminProcedures.passkeys.registrationOptions.handler(async ({ context }) => {
    const admin = await findAdminUser(context.db);

    if (admin === undefined) {
      throw new Error("ログイン中なのに、管理者の行が無い");
    }

    return createRegistrationOptions({
      challenge: context.challenges.issue(
        { kind: "addition", sessionId: context.session.id },
        context.clock.now(),
      ),
      rpId: context.relyingParty.rpId,
      userHandle: admin.userHandle,
      registered: await listPasskeys(context.db, admin.id),
    });
  });
