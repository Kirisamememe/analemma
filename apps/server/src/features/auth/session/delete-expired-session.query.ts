import { type SQL, and, eq, lte, or } from "drizzle-orm";

import { session } from "../../../db/schema/session";
import type { DatabaseExecutor } from "../../../platform/database";
import {
  SESSION_ABSOLUTE_LIMIT_MS,
  SESSION_IDLE_LIMIT_MS,
} from "./decide-session";

/** 消す切れたセッションと、届いた日時。 */
export type ExpiredSession = {
  /** セッションの ID。 */
  readonly id: string;
  /** 届いた日時。 */
  readonly now: Date;
};

/** その日時に切れているセッションの行を選ぶ条件を作る。 */
export const matchExpiredSessions = (now: Date): SQL | undefined =>
  or(
    lte(session.lastUsedAt, new Date(now.getTime() - SESSION_IDLE_LIMIT_MS)),
    lte(session.createdAt, new Date(now.getTime() - SESSION_ABSOLUTE_LIMIT_MS)),
  );

/** セッションの行を、その日時にまだ切れているときだけ消す。 */
export const deleteExpiredSession = async (
  db: DatabaseExecutor,
  { id, now }: ExpiredSession,
): Promise<void> => {
  await db
    .delete(session)
    .where(and(eq(session.id, id), matchExpiredSessions(now)));
};
