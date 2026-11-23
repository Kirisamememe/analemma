/** Dropbox の許可の画面へ送り出した、1回の許可の求め。 */
type Authorization = {
  /** PKCE の code_verifier。 */
  readonly codeVerifier: string;
  /** 許可を求めたセッションの ID。 */
  readonly sessionId: string;
  /** 切れる日時のミリ秒。 */
  readonly expiresAt: number;
};

/** 許可の求めを出すときの値。 */
export type AuthorizationRequest = {
  /** 許可を求めたセッションの ID。 */
  readonly sessionId: string;
  /** 求めた日時。 */
  readonly now: Date;
};

/** 出した許可の求めの、state と PKCE の値。 */
export type IssuedAuthorization = {
  /** 戻ってきたリクエストを照らし合わせる state。 */
  readonly state: string;
  /** PKCE の code_challenge(S256)。 */
  readonly codeChallenge: string;
  /** PKCE の code_verifier。 */
  readonly codeVerifier: string;
};

/** Dropbox の許可の求めを、1回きりで覚えておく表。 */
export type AuthorizationStore = {
  /** state と PKCE の値を作って覚える。 */
  readonly issue: (
    request: AuthorizationRequest,
  ) => Promise<IssuedAuthorization>;
  /** 戻ってきた state を取り出して忘れ、覚えていた code_verifier を返す。 */
  readonly take: (
    state: string,
    request: AuthorizationRequest,
  ) => string | undefined;
};

const LIFETIME_MS = 10 * 60 * 1000;
const CAPACITY = 16;
const RANDOM_BYTES = 32;

const randomText = (): string =>
  crypto
    .getRandomValues(new Uint8Array(RANDOM_BYTES))
    .toBase64({ alphabet: "base64url", omitPadding: true });

const toChallenge = async (verifier: string): Promise<string> =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  ).toBase64({ alphabet: "base64url", omitPadding: true });

/** Dropbox の許可の求めを、プロセスのメモリに覚えておく表を作る。 */
export const createAuthorizationStore = (): AuthorizationStore => {
  const entries = new Map<string, Authorization>();

  return {
    issue: async ({ sessionId, now }) => {
      for (const oldest of entries.keys()) {
        if (entries.size < CAPACITY) break;

        entries.delete(oldest);
      }

      const state = randomText();
      const codeVerifier = randomText();

      entries.set(state, {
        codeVerifier,
        sessionId,
        expiresAt: now.getTime() + LIFETIME_MS,
      });

      return {
        state,
        codeVerifier,
        codeChallenge: await toChallenge(codeVerifier),
      };
    },
    take: (state, { sessionId, now }) => {
      const entry = entries.get(state);

      entries.delete(state);

      return entry?.sessionId === sessionId && entry.expiresAt > now.getTime()
        ? entry.codeVerifier
        : undefined;
    },
  };
};
