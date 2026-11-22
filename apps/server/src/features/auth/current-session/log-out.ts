import { deleteSession } from "@/features/auth/session/queries/session.query";
import { clearSessionCookie, toSessionCookie } from "@/platform/session-cookie";
import { adminProcedures } from "@/procedures";

/** 今のセッションを終え、Cookie を消させる procedure。 */
export const logOut = adminProcedures.session.logOut.handler(
  async ({ context }) => {
    await deleteSession(context.db, context.session.id);
    clearSessionCookie(
      context.resHeaders,
      toSessionCookie(context.relyingParty.origin),
    );
    context.logger.write({
      level: "info",
      message: "ログアウトした",
      details: { sessionId: context.session.id },
    });
  },
);
