import { adminProcedures } from "../../../procedures";
import { toSessionCookie } from "../session/to-session-cookie";
import { clearSessionCookie } from "../session/write-session-cookie";
import { deleteAllSessions } from "./delete-all-sessions.query";

/** 今のセッションも含めて、すべてのセッションからログアウトする procedure。 */
export const logOutAllSessions = adminProcedures.session.logOutAll.handler(
  async ({ context }) => {
    const loggedOut = await deleteAllSessions(
      context.db,
      context.session.adminUserId,
    );

    clearSessionCookie(
      context.resHeaders,
      toSessionCookie(context.relyingParty.origin),
    );
    context.logger.write({
      level: "info",
      message: "すべてのセッションからログアウトした",
      details: { sessionId: context.session.id, loggedOut },
    });

    return { loggedOut };
  },
);
