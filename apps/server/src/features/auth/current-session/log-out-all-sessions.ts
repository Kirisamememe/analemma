import { deleteAllSessions } from "@/features/auth/current-session/queries/delete-all-sessions.query";
import { clearSessionCookie, toSessionCookie } from "@/platform/session-cookie";
import { adminProcedures } from "@/procedures";

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
