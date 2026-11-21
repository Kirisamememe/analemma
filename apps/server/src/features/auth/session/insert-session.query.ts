import { and, desc, eq, notInArray } from "drizzle-orm";

import { session } from "../../../db/schema/session";
import type { DatabaseExecutor } from "../../../platform/database";
import { matchExpiredSessions } from "./delete-expired-session.query";

/** 1人の管理者が持てるセッションの数。 */
export const MAX_SESSIONS = 10;

/** 新しいセッションの行。 */
export type NewSession = {
  /** token の前半の ID。 */
  readonly id: string;
  /** token の後半の secret の SHA-256。 */
  readonly secretHash: Uint8Array<ArrayBuffer>;
  /** 管理者の ID。 */
  readonly adminUserId: number;
  /** ログインした日時。 */
  readonly now: Date;
};

/** 切れたセッションと古いセッションを消してから、新しいセッションの行を作る。 */
export const insertSession = async (
  db: DatabaseExecutor,
  { adminUserId, id, now, secretHash }: NewSession,
): Promise<void> => {
  const ownedBy = eq(session.adminUserId, adminUserId);

  await db.delete(session).where(and(ownedBy, matchExpiredSessions(now)));
  await db.delete(session).where(
    and(
      ownedBy,
      notInArray(
        session.id,
        db
          .select({ id: session.id })
          .from(session)
          .where(ownedBy)
          .orderBy(desc(session.createdAt), desc(session.id))
          .limit(MAX_SESSIONS - 1),
      ),
    ),
  );
  await db.insert(session).values({
    id,
    secretHash,
    adminUserId,
    createdAt: now,
    lastUsedAt: now,
  });
};
