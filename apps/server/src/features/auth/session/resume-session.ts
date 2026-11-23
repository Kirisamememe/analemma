import {
  equalSecretHashes,
  readSecretToken,
} from "@/features/auth/secret-token/secret-token";
import { decideSession } from "@/features/auth/session/decide-session";
import {
  type SessionRow,
  deleteExpiredSession,
  findSession,
  refreshSession,
} from "@/features/auth/session/queries/session.query";
import type { DatabaseExecutor } from "@/platform/database";

/** ログイン中の管理者のセッション。 */
export type Session = {
  /** セッションの ID。 */
  readonly id: string;
  /** 管理者の ID。 */
  readonly adminUserId: number;
  /** セッションが切れる日時。 */
  readonly expiresAt: Date;
};

/** 続けられたセッションと、期限を延ばしたか。 */
export type ResumedSession = {
  /** どの結果か。 */
  readonly _tag: "Active";
  /** 続けたセッション。 */
  readonly session: Session;
  /** 期限を延ばしたか。 */
  readonly refreshed: boolean;
};

/** token でセッションを続けられないこと。 */
export type InvalidSession = {
  /** どの結果か。 */
  readonly _tag: "Invalid";
};

/** セッションを続けるリクエスト。 */
export type SessionResume = {
  /** Drizzle で問い合わせる DB。 */
  readonly db: DatabaseExecutor;
  /** Cookie から読んだ token。 */
  readonly token: string;
  /** リクエストを受けた日時。 */
  readonly now: Date;
};

const INVALID: InvalidSession = { _tag: "Invalid" };

const findTokenSession = async (
  db: DatabaseExecutor,
  token: string,
): Promise<SessionRow | undefined> => {
  const parts = await readSecretToken(token);

  if (parts._tag === "Malformed") {
    return undefined;
  }

  const row = await findSession(db, parts.id);

  return row !== undefined &&
    equalSecretHashes(row.secretHash, parts.secretHash)
    ? row
    : undefined;
};

/** Cookie の token でセッションを続け、要るなら期限を延ばす。 */
export const resumeSession = async ({
  db,
  now,
  token,
}: SessionResume): Promise<ResumedSession | InvalidSession> => {
  const row = await findTokenSession(db, token);

  if (row === undefined) {
    return INVALID;
  }

  const decision = decideSession(row, now);

  if (decision._tag === "Expired") {
    await deleteExpiredSession(db, { id: row.id, now });

    return INVALID;
  }

  if (decision.refresh) {
    await refreshSession(db, { id: row.id, now });
  }

  return {
    _tag: "Active",
    session: {
      id: row.id,
      adminUserId: row.adminUserId,
      expiresAt: decision.expiresAt,
    },
    refreshed: decision.refresh,
  };
};

/** 期限を延ばさずに、Cookie の token のセッションが続いているかを確かめる。 */
export const isSessionActive = async ({
  db,
  now,
  token,
}: SessionResume): Promise<boolean> => {
  const row = await findTokenSession(db, token);

  return row !== undefined && decideSession(row, now)._tag === "Active";
};
