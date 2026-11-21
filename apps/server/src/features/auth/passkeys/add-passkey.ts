import { adminProcedures } from "../../../procedures";
import { reauthenticate } from "../current-session/reauthenticate";
import { REGISTRATION_ERRORS } from "../registration/registration-errors";
import { verifyPasskeyRegistration } from "../registration/verify-passkey-registration";
import { recordAddition } from "./record-addition.query";
import { toPasskeySummary } from "./to-passkey-summary";

/** 今のパスキーで確かめ直してから、管理者のパスキーを足す procedure。 */
export const addPasskey = adminProcedures.passkeys.register.handler(
  async ({ context, errors, input }) => {
    const { adminUserId, id: sessionId } = context.session;
    const reauthenticated = await reauthenticate(context, {
      action: "passkeys.register",
      assertion: input.assertion,
    });

    if (reauthenticated._tag === "Rejected") {
      throw errors.REAUTHENTICATION_FAILED();
    }

    const verified = await verifyPasskeyRegistration({
      challenges: context.challenges,
      relyingParty: context.relyingParty,
      credential: input.credential,
      purpose: { kind: "addition", sessionId },
      now: reauthenticated.use.now,
    });

    if (verified._tag !== "Verified") {
      context.logger.write({
        level: "info",
        message: "パスキーの追加を断った",
        details: { reason: verified, sessionId },
      });

      throw errors[REGISTRATION_ERRORS[verified._tag]]();
    }

    const added = await recordAddition(context.db, {
      reauthentication: { sessionId, use: reauthenticated.use },
      passkey: {
        passkey: verified.passkey,
        adminUserId,
        name: input.name,
        now: reauthenticated.use.now,
      },
    });

    if (added._tag === "SessionGone") {
      throw errors.UNAUTHORIZED();
    }

    if (added._tag === "PasskeyGone") {
      throw errors.REAUTHENTICATION_FAILED();
    }

    if (added._tag === "Duplicate") {
      throw errors.DUPLICATE_CREDENTIAL();
    }

    context.logger.write({
      level: "info",
      message: "パスキーを足した",
      details: { passkeyId: added.row.id, sessionId },
    });

    return toPasskeySummary(added.row);
  },
);
