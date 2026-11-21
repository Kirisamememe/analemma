import type { DatabaseExecutor } from "../../../platform/database";
import { equalSecretHashes } from "../secret-token/equal-secret-hashes";
import { readSecretToken } from "../secret-token/read-secret-token";
import { findEnrollment } from "./find-enrollment.query";

/** 使える登録用の token。 */
export type ValidEnrollment = {
  /** 結果の種類。 */
  readonly _tag: "Valid";
  /** 登録用の token の ID。 */
  readonly enrollmentId: string;
  /** 管理者の ID。 */
  readonly adminUserId: number;
};

/** 知らない・使った・期限切れの登録用の token。 */
export type InvalidEnrollment = {
  /** 結果の種類。 */
  readonly _tag: "Invalid";
};

/** 登録用の token を確かめるリクエスト。 */
export type EnrollmentCheck = {
  /** Drizzle で問い合わせる DB。 */
  readonly db: DatabaseExecutor;
  /** 登録用 URL の token。 */
  readonly token: string;
  /** 届いた日時。 */
  readonly now: Date;
};

/** 登録用の token が、使える1回きりの token かを確かめる。 */
export const checkEnrollment = async ({
  db,
  now,
  token,
}: EnrollmentCheck): Promise<ValidEnrollment | InvalidEnrollment> => {
  const parts = await readSecretToken(token);

  if (parts._tag === "Malformed") {
    return { _tag: "Invalid" };
  }

  const row = await findEnrollment(db, parts.id);

  return row !== undefined &&
    equalSecretHashes(row.secretHash, parts.secretHash) &&
    row.expiresAt.getTime() > now.getTime()
    ? { _tag: "Valid", enrollmentId: row.id, adminUserId: row.adminUserId }
    : { _tag: "Invalid" };
};
