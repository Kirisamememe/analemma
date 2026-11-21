import type { DatabaseExecutor } from "../../../platform/database";
import { equalSecretHashes } from "../secret-token/equal-secret-hashes";
import { readSecretToken } from "../secret-token/read-secret-token";
import { decideSession } from "./decide-session";
import { deleteExpiredSession } from "./delete-expired-session.query";
import { findSession } from "./find-session.query";
import { refreshSession } from "./refresh-session.query";

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

/** Cookie の token でセッションを続け、要るなら期限を延ばす。 */
export const resumeSession = async ({
  db,
  now,
  token,
}: SessionResume): Promise<ResumedSession | InvalidSession> => {
  const parts = await readSecretToken(token);

  if (parts._tag === "Malformed") {
    return INVALID;
  }

  const row = await findSession(db, parts.id);

  if (
    row === undefined ||
    !equalSecretHashes(row.secretHash, parts.secretHash)
  ) {
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
