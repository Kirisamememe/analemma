import { adminProcedures } from "../../../procedures";
import { reauthenticate } from "../current-session/reauthenticate";
import { deletePasskey as deletePasskeyRow } from "./delete-passkey.query";

/** 再認証の後で、最後の1つでないパスキーを消し、ほかのセッションからログアウトさせる procedure。 */
export const deletePasskey = adminProcedures.passkeys.delete.handler(
  async ({ context, errors, input }) => {
    const reauthenticated = await reauthenticate(context, {
      action: "passkeys.delete",
      assertion: input.assertion,
    });

    if (reauthenticated._tag === "Rejected") {
      throw errors.REAUTHENTICATION_FAILED();
    }

    const deleted = await deletePasskeyRow(context.db, {
      id: input.id,
      reauthentication: {
        sessionId: context.session.id,
        use: reauthenticated.use,
      },
    });

    if (deleted._tag === "SessionGone") {
      throw errors.UNAUTHORIZED();
    }

    if (deleted._tag === "PasskeyGone") {
      throw errors.REAUTHENTICATION_FAILED();
    }

    if (deleted._tag === "NotFound") {
      throw errors.NOT_FOUND();
    }

    if (deleted._tag === "LastPasskey") {
      throw errors.LAST_PASSKEY();
    }

    context.logger.write({
      level: "info",
      message: "パスキーを消した",
      details: {
        passkeyId: input.id,
        sessionId: context.session.id,
        loggedOut: deleted.loggedOut,
      },
    });
  },
);
