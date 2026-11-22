import type { DatabaseExecutor } from "../../../platform/database";
import { issueSecretToken } from "../secret-token/secret-token";
import { replaceEnrollment } from "./replace-enrollment.query";
import { toEnrollmentUrl } from "./to-enrollment-url";

/** 登録用 URL が使える時間(10分)。 */
export const ENROLLMENT_LIFETIME_MS = 10 * 60 * 1000;

/** 登録用 URL を出すのに要る値。 */
export type EnrollmentIssue = {
  /** Drizzle で問い合わせる DB。 */
  readonly db: DatabaseExecutor;
  /** 管理画面の origin。 */
  readonly origin: string;
  /** 出す日時。 */
  readonly now: Date;
};

/** 出した登録用 URL。 */
export type IssuedEnrollment = {
  /** 登録用の token の ID。 */
  readonly enrollmentId: string;
  /** 1回きりの登録用 URL。 */
  readonly url: string;
  /** 登録用 URL が切れる日時。 */
  readonly expiresAt: Date;
};

/** 最初のパスキーの登録と復旧のための、1回きりの登録用 URL を出す。 */
export const issueEnrollment = async ({
  db,
  now,
  origin,
}: EnrollmentIssue): Promise<IssuedEnrollment> => {
  const issued = await issueSecretToken();
  const expiresAt = new Date(now.getTime() + ENROLLMENT_LIFETIME_MS);

  await replaceEnrollment(db, {
    id: issued.id,
    secretHash: issued.secretHash,
    now,
    expiresAt,
  });

  return {
    enrollmentId: issued.id,
    url: toEnrollmentUrl(origin, issued.token),
    expiresAt,
  };
};
