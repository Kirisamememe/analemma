/** 使わないままセッションが切れるまでの時間(7日)。 */
export const SESSION_IDLE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

/** ログインからセッションが必ず切れるまでの時間(30日)。 */
export const SESSION_ABSOLUTE_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

/** 最後に使った日時と Cookie を書き直す間隔(1時間)。 */
export const SESSION_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

/** セッションの期限を決める、行の日時。 */
export type SessionTimes = {
  /** ログインした日時。 */
  readonly createdAt: Date;
  /** 最後に使ったと書いた日時。 */
  readonly lastUsedAt: Date;
};

/** セッションが切れていること。 */
export type ExpiredSession = {
  /** 結果の種類。 */
  readonly _tag: "Expired";
};

/** セッションが続いていることと、その期限。 */
export type ActiveSession = {
  /** 結果の種類。 */
  readonly _tag: "Active";
  /** 書き直した後の、セッションが切れる日時。 */
  readonly expiresAt: Date;
  /** 最後に使った日時と Cookie を書き直すか。 */
  readonly refresh: boolean;
};

/** セッションが切れる日時を求める。 */
export const toSessionExpiry = ({
  createdAt,
  lastUsedAt,
}: SessionTimes): Date =>
  new Date(
    Math.min(
      createdAt.getTime() + SESSION_ABSOLUTE_LIMIT_MS,
      lastUsedAt.getTime() + SESSION_IDLE_LIMIT_MS,
    ),
  );

/** セッションが続いているか、期限を延ばすかを決める。 */
export const decideSession = (
  times: SessionTimes,
  now: Date,
): ActiveSession | ExpiredSession => {
  if (now.getTime() >= toSessionExpiry(times).getTime()) {
    return { _tag: "Expired" };
  }

  const refresh =
    now.getTime() - times.lastUsedAt.getTime() >= SESSION_REFRESH_INTERVAL_MS;

  return {
    _tag: "Active",
    expiresAt: refresh
      ? toSessionExpiry({ createdAt: times.createdAt, lastUsedAt: now })
      : toSessionExpiry(times),
    refresh,
  };
};
