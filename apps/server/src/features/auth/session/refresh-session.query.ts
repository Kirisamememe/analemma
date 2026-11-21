import { and, eq, lt } from "drizzle-orm";

import { session } from "../../../db/schema/session";
import type { DatabaseExecutor } from "../../../platform/database";

/** 書き直すセッションと、使った日時。 */
export type SessionRefresh = {
  /** セッションの ID。 */
  readonly id: string;
  /** 使った日時。 */
  readonly now: Date;
};

/** セッションの、最後に使った日時を進める。 */
export const refreshSession = async (
  db: DatabaseExecutor,
  { id, now }: SessionRefresh,
): Promise<void> => {
  await db
    .update(session)
    .set({ lastUsedAt: now })
    .where(and(eq(session.id, id), lt(session.lastUsedAt, now)));
};
