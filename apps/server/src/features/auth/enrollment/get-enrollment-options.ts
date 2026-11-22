import { findAdminUser } from "@/features/auth/admin-user/queries/admin-user.query";
import { checkEnrollment } from "@/features/auth/enrollment/check-enrollment";
import { listPasskeys } from "@/features/auth/passkeys/queries/list-passkeys.query";
import { createRegistrationOptions } from "@/features/auth/registration/create-registration-options";
import { authProcedures } from "@/procedures";

/** 登録用 URL の token で、パスキーの登録の options を返す procedure。 */
export const getEnrollmentOptions = authProcedures.enrollment.options.handler(
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

    const admin = await findAdminUser(context.db);

    if (admin === undefined) {
      throw new Error("登録用の token があるのに、管理者の行が無い");
    }

    return createRegistrationOptions({
      challenge: context.challenges.issue(
        { kind: "enrollment", enrollmentId: enrollment.enrollmentId },
        now,
      ),
      rpId: context.relyingParty.rpId,
      userHandle: admin.userHandle,
      registered: await listPasskeys(context.db, admin.id),
    });
  },
);
