/** challenge を出した用途。 */
export type ChallengePurpose =
  | {
      /** ログイン。 */
      readonly kind: "login";
    }
  | {
      /** 登録用 URL からの登録。 */
      readonly kind: "enrollment";
      /** 登録用の token の ID。 */
      readonly enrollmentId: string;
    }
  | {
      /** ログイン中の管理者がパスキーを足すこと。 */
      readonly kind: "addition";
      /** challenge を求めたセッションの ID。 */
      readonly sessionId: string;
    }
  | {
      /** 今のパスキーで、管理者を確かめ直すこと。 */
      readonly kind: "reauthentication";
      /** challenge を求めたセッションの ID。 */
      readonly sessionId: string;
    };

/** 取り出した challenge。 */
export type TakenChallenge = {
  /** どの結果か。 */
  readonly _tag: "Taken";
  /** 出した challenge のバイト列。 */
  readonly challenge: Uint8Array<ArrayBuffer>;
};

/** 知らない・期限切れ・用途の違う challenge だったこと。 */
export type MissingChallenge = {
  /** どの結果か。 */
  readonly _tag: "Missing";
};

/** challenge を取り出すときに照らす値。 */
export type ChallengeRedemption = {
  /** 期待する用途。 */
  readonly purpose: ChallengePurpose;
  /** 届いた日時。 */
  readonly now: Date;
};

/** 出した challenge を1回きりで覚えておく表。 */
export type ChallengeStore = {
  /** challenge を出して覚え、その base64url を返す。 */
  readonly issue: (purpose: ChallengePurpose, now: Date) => string;
  /** 届いた challenge を取り出して忘れる。 */
  readonly take: (
    challenge: string,
    redemption: ChallengeRedemption,
  ) => TakenChallenge | MissingChallenge;
};

/** challenge の表の大きさと寿命。 */
export type ChallengeStoreOptions = {
  /** 覚えておく数の上限。 */
  readonly capacity: number;
  /** challenge の寿命のミリ秒。 */
  readonly lifetimeMs: number;
};

/** 覚えている challenge。 */
type Entry = {
  /** 出した challenge のバイト列。 */
  readonly challenge: Uint8Array<ArrayBuffer>;
  /** 用途を1つの文字列にしたもの。 */
  readonly purpose: string;
  /** 切れる日時のミリ秒。 */
  readonly expiresAt: number;
};

/** challenge の寿命(5分)。 */
export const CHALLENGE_LIFETIME_MS = 5 * 60 * 1000;

/** 覚えておく challenge の数の上限。 */
export const CHALLENGE_CAPACITY = 10_000;

const CHALLENGE_BYTES = 32;

const toPurposeKey = (purpose: ChallengePurpose): string => {
  switch (purpose.kind) {
    case "login": {
      return "login";
    }
    case "enrollment": {
      return `enrollment:${purpose.enrollmentId}`;
    }
    case "addition":
    case "reauthentication": {
      return `${purpose.kind}:${purpose.sessionId}`;
    }
  }
};

/** 出した challenge を、プロセスのメモリに1回きりで覚えておく表を作る。 */
export const createChallengeStore = ({
  capacity,
  lifetimeMs,
}: ChallengeStoreOptions): ChallengeStore => {
  const entries = new Map<string, Entry>();

  return {
    issue: (purpose, now) => {
      for (const oldest of entries.keys()) {
        if (entries.size < capacity) {
          break;
        }

        entries.delete(oldest);
      }

      const challenge = crypto.getRandomValues(new Uint8Array(CHALLENGE_BYTES));

      const key = challenge.toBase64({
        alphabet: "base64url",
        omitPadding: true,
      });

      entries.set(key, {
        challenge,
        purpose: toPurposeKey(purpose),
        expiresAt: now.getTime() + lifetimeMs,
      });

      return key;
    },
    take: (challenge, { now, purpose }) => {
      const entry = entries.get(challenge);

      entries.delete(challenge);

      return entry !== undefined &&
        entry.expiresAt > now.getTime() &&
        entry.purpose === toPurposeKey(purpose)
        ? { _tag: "Taken", challenge: entry.challenge }
        : { _tag: "Missing" };
    },
  };
};
