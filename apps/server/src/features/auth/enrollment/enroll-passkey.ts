import { checkEnrollment } from "@/features/auth/enrollment/check-enrollment";
import { completeEnrollment } from "@/features/auth/enrollment/queries/complete-enrollment.query";
import { REGISTRATION_ERRORS } from "@/features/auth/registration/registration-errors";
import { verifyPasskeyRegistration } from "@/features/auth/registration/verify-passkey-registration";
import { issueSecretToken } from "@/features/auth/secret-token/secret-token";
import { toSessionExpiry } from "@/features/auth/session/decide-session";
import { toSessionCookie } from "@/features/auth/session/to-session-cookie";
import { writeSessionCookie } from "@/features/auth/session/write-session-cookie";
import { authProcedures } from "@/procedures";

/** 登録用 URL の token でパスキーを登録し、ログインする procedure。 */
export const enrollPasskey = authProcedures.enrollment.register.handler(
  async ({ context, errors, input }) => {
    const now = context.clock.now();
    const enrollment = await checkEnrollment({
      db: context.db,
      token: input.token,
      now,
    });

    if (enrollment._tag === "Invalid") {
      context.logger.write({
        level: "info",
        message: "使えない登録用 URL の token を断った",
        details: {},
      });

      throw errors.INVALID_ENROLLMENT();
    }

    const verified = await verifyPasskeyRegistration({
      challenges: context.challenges,
      relyingParty: context.relyingParty,
      credential: input.credential,
      purpose: { kind: "enrollment", enrollmentId: enrollment.enrollmentId },
      now,
    });

    if (verified._tag !== "Verified") {
      context.logger.write({
        level: "info",
        message: "登録用 URL からのパスキーの登録を断った",
        details: { reason: verified },
      });

      throw errors[REGISTRATION_ERRORS[verified._tag]]();
    }

    const issued = await issueSecretToken();
    const completed = await completeEnrollment(context.db, {
      enrollmentId: enrollment.enrollmentId,
      passkey: {
        passkey: verified.passkey,
        adminUserId: enrollment.adminUserId,
        name: input.name,
        now,
      },
      session: { id: issued.id, secretHash: issued.secretHash },
    });

    if (completed._tag === "InvalidEnrollment") {
      throw errors.INVALID_ENROLLMENT();
    }

    if (completed._tag === "Duplicate") {
      throw errors.DUPLICATE_CREDENTIAL();
    }

    const expiresAt = toSessionExpiry({ createdAt: now, lastUsedAt: now });

    writeSessionCookie(context.resHeaders, {
      cookie: toSessionCookie(context.relyingParty.origin),
      token: issued.token,
      expiresAt,
      now,
    });
    context.logger.write({
      level: "info",
      message: "登録用 URL からパスキーを登録して、ログインした",
      details: { passkeyId: completed.row.id, sessionId: issued.id },
    });

    return { expiresAt: expiresAt.toISOString() };
  },
);
