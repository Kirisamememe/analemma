import { eq, and, type SQL, lte, or, desc, notInArray, lt } from "drizzle-orm";

import { session } from "@/db/schema/auth/session";
import {
  SESSION_ABSOLUTE_LIMIT_MS,
  SESSION_IDLE_LIMIT_MS,
} from "@/features/auth/session/decide-session";
import type { DatabaseExecutor } from "@/platform/database";

/** セッションの行。 */
export type SessionRow = typeof session.$inferSelect;

/** token の前半の ID で、セッションの行を引く。 */
export const findSession = async (
  db: DatabaseExecutor,
  id: string,
): Promise<SessionRow | undefined> => {
  const [row] = await db.select().from(session).where(eq(session.id, id));

  return row;
};

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

/** セッションの行を消す。 */
export const deleteSession = async (
  db: DatabaseExecutor,
  id: string,
): Promise<void> => {
  await db.delete(session).where(eq(session.id, id));
};
