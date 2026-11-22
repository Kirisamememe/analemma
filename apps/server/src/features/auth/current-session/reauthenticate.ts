import type { RequestContext } from "@/context";
import type { AuthenticationCredentialInput } from "@/features/auth/login/decode-authentication-credential";
import type { PasskeyUse } from "@/features/auth/login/record-passkey-use.query";
import { verifyLogin } from "@/features/auth/login/verify-login";
import { writeLoginWarnings } from "@/features/auth/login/write-login-warnings";
import type { Session } from "@/features/auth/session/resume-session";

/** ログイン中の管理者のリクエストの依存。 */
export type AdminRequestContext = RequestContext & {
  /** ログイン中のセッション。 */
  readonly session: Session;
};

/** 再認証を求めた procedure と、届いた資格情報。 */
export type ReauthenticationRequest = {
  /** 再認証を求めた procedure。 */
  readonly action:
    | "passkeys.register"
    | "passkeys.delete"
    | "deployTokens.issue";
  /** 今のパスキーで確かめ直した、ログインの資格情報。 */
  readonly assertion: AuthenticationCredentialInput;
};

/** 再認証の結果。 */
export type ReauthenticationResult =
  | {
      /** 確かめ直せた。 */
      readonly _tag: "Reauthenticated";
      /** 再認証に使ったパスキーと、届いた値。 */
      readonly use: PasskeyUse;
    }
  | {
      /** 確かめ直せなかった。 */
      readonly _tag: "Rejected";
    };

/** 届いた資格情報で、ログイン中の管理者を今のパスキーで確かめ直す。 */
export const reauthenticate = async (
  context: AdminRequestContext,
  { action, assertion }: ReauthenticationRequest,
): Promise<ReauthenticationResult> => {
  const now = context.clock.now();
  const { adminUserId, id: sessionId } = context.session;
  const verified = await verifyLogin({
    db: context.db,
    challenges: context.challenges,
    relyingParty: context.relyingParty,
    credential: assertion,
    purpose: { kind: "reauthentication", sessionId },
    now,
  });

  if (verified._tag !== "Verified") {
    context.logger.write({
      level: "info",
      message: "再認証を断った",
      details: { action, reason: verified, sessionId },
    });

    return { _tag: "Rejected" };
  }

  writeLoginWarnings(context.logger, verified);

  return {
    _tag: "Reauthenticated",
    use: {
      id: verified.passkey.id,
      adminUserId,
      publicKey: verified.passkey.publicKey,
      signCount: verified.signCount,
      backedUp: verified.backedUp,
      now,
    },
  };
};
