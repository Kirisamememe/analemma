/** Dropbox の認可の画面へ送り出し、戻るのを待っている認可。 */
export type PendingAuthorization = {
  /** 認可の画面に渡した state。 */
  readonly state: string;
  /** 認可の画面に渡した redirect URI。 */
  readonly redirectUri: string;
  /** 認可を始めたセッションの ID。 */
  readonly sessionId: string;
};

/** 覚えた認可と、切れる日時。 */
type Entry = PendingAuthorization & {
  /** 切れる日時のミリ秒。 */
  readonly expiresAt: number;
};

/** 戻ってきた認可を照らす値。 */
export type AuthorizationReturn = {
  /** 戻ってきた state。 */
  readonly state: string;
  /** 戻ってきたリクエストのセッションの ID。 */
  readonly sessionId: string;
  /** 戻ってきた日時。 */
  readonly now: Date;
};

/** 戻るのを待っている認可を、state ごとに1回きりで覚えておく表。 */
export type DropboxAuthorizations = {
  /** 認可を、state で覚える。 */
  readonly remember: (pending: PendingAuthorization, now: Date) => void;
  /** 戻ってきた state の、待っている認可を取り出して忘れる。 */
  readonly take: (
    returned: AuthorizationReturn,
  ) => PendingAuthorization | undefined;
};

/** 認可の画面を開いてから戻るまでを待つ時間。 */
export const AUTHORIZATION_LIFETIME_MS = 10 * 60 * 1000;

const CAPACITY = 20; // 開きかけの認可の画面は少ない

/** 戻るのを待っている認可を、プロセスのメモリに覚えておく表を作る。 */
export const createDropboxAuthorizations = (): DropboxAuthorizations => {
  const entries = new Map<string, Entry>();

  return {
    remember: (pending, now) => {
      for (const oldest of entries.keys()) {
        if (entries.size < CAPACITY) break;

        entries.delete(oldest);
      }

      entries.set(pending.state, {
        ...pending,
        expiresAt: now.getTime() + AUTHORIZATION_LIFETIME_MS,
      });
    },
    take: ({ state, sessionId, now }) => {
      const entry = entries.get(state);

      entries.delete(state);

      if (
        entry === undefined ||
        entry.expiresAt <= now.getTime() ||
        entry.sessionId !== sessionId
      ) {
        return undefined;
      }

      return { state, redirectUri: entry.redirectUri, sessionId };
    },
  };
};
