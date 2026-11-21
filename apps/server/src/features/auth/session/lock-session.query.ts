import { and, eq } from "drizzle-orm";

import { session } from "../../../db/schema/session";
import type { DatabaseExecutor } from "../../../platform/database";

/** ロックを取るセッションと、その持ち主。 */
export type SessionLock = {
  /** セッションの ID。 */
  readonly id: string;
  /** 管理者の ID。 */
  readonly adminUserId: number;
};

/** トランザクションの終わりまでセッションの行を消させず、まだあるかを返す。 */
export const lockSession = async (
  db: DatabaseExecutor,
  { adminUserId, id }: SessionLock,
): Promise<boolean> => {
  const rows = await db
    .select({ id: session.id })
    .from(session)
    .where(and(eq(session.id, id), eq(session.adminUserId, adminUserId)))
    .for("share");

  return rows.length > 0;
};
