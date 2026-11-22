import { eq } from "drizzle-orm";

import { session } from "@/db/schema/session";
import type { DatabaseExecutor } from "@/platform/database";

/** 管理者のセッションをすべて消し、消した数を返す。 */
export const deleteAllSessions = async (
  db: DatabaseExecutor,
  adminUserId: number,
): Promise<number> => {
  const deleted = await db
    .delete(session)
    .where(eq(session.adminUserId, adminUserId))
    .returning({ id: session.id });

  return deleted.length;
};
