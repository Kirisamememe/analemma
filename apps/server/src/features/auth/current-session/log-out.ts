import { deleteSession } from "@/features/auth/session/session.query";
import { toSessionCookie } from "@/features/auth/session/to-session-cookie";
import { clearSessionCookie } from "@/features/auth/session/write-session-cookie";
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
