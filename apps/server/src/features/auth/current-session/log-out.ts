import { adminProcedures } from "../../../procedures";
import { deleteSession } from "../session/session.query";
import { toSessionCookie } from "../session/to-session-cookie";
import { clearSessionCookie } from "../session/write-session-cookie";

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
