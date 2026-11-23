import { recordLogin } from "@/features/auth/login/queries/record-login.query";
import {
  type LoginFailure,
  verifyLogin,
} from "@/features/auth/login/verify-login";
import { writeLoginWarnings } from "@/features/auth/login/write-login-warnings";
import {
  issueSecretToken,
  readSecretToken,
} from "@/features/auth/secret-token/secret-token";
import { toSessionExpiry } from "@/features/auth/session/decide-session";
import {
  readSessionCookie,
  toSessionCookie,
  writeSessionCookie,
} from "@/platform/session-cookie";
import { authProcedures } from "@/procedures";

const LOGIN_ERRORS = {
  ChallengeExpired: "CHALLENGE_EXPIRED",
  UnknownCredential: "UNKNOWN_CREDENTIAL",
  InvalidCredential: "INVALID_CREDENTIAL",
} as const satisfies Record<LoginFailure["_tag"], string>;

/** パスキーの署名を確かめてセッションを始め、Cookie を書く procedure。 */
export const logIn = authProcedures.login.verify.handler(
  async ({ context, errors, input }) => {
    const now = context.clock.now();

    const verified = await verifyLogin({
      db: context.db,
      challenges: context.challenges,
      relyingParty: context.relyingParty,
      credential: input,
      purpose: { kind: "login" },
      now,
    });

    if (verified._tag !== "Verified") {
      context.logger.write({
        level: "info",
        message: "ログインを断った",
        details: { reason: verified },
      });

      throw errors[LOGIN_ERRORS[verified._tag]]();
    }

    writeLoginWarnings(context.logger, verified);

    const cookie = toSessionCookie(context.relyingParty.origin);
    const previousToken = readSessionCookie(context.headers, cookie);

    const previous =
      previousToken === undefined
        ? undefined
        : await readSecretToken(previousToken);

    const issued = await issueSecretToken();

    const recorded = await recordLogin(context.db, {
      use: {
        id: verified.passkey.id,
        adminUserId: verified.passkey.adminUserId,
        publicKey: verified.passkey.publicKey,
        signCount: verified.signCount,
        backedUp: verified.backedUp,
        now,
      },
      session: { id: issued.id, secretHash: issued.secretHash },
      previous: previous?._tag === "Read" ? previous : undefined,
    });

    if (recorded._tag === "PasskeyGone") {
      context.logger.write({
        level: "info",
        message: "ログインを断った",
        details: {
          reason: { _tag: "PasskeyGone", passkeyId: verified.passkey.id },
        },
      });

      throw errors.UNKNOWN_CREDENTIAL();
    }

    const expiresAt = toSessionExpiry({ createdAt: now, lastUsedAt: now });

    writeSessionCookie(context.resHeaders, {
      cookie,
      token: issued.token,
      expiresAt,
      now,
    });
    context.logger.write({
      level: "info",
      message: "ログインした",
      details: { passkeyId: verified.passkey.id, sessionId: issued.id },
    });

    return { expiresAt: expiresAt.toISOString() };
  },
);
