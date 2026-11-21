/** パスキーで管理者を確かめる server の、origin と RP ID。 */
export type RelyingParty = {
  /** 管理画面の origin。 */
  readonly origin: string;
  /** パスキーを結びつけるドメイン。 */
  readonly rpId: string;
};

/** 環境変数から読み取れた origin と RP ID。 */
export type ParsedRelyingParty = {
  /** どの結果か。 */
  readonly _tag: "Parsed";
  /** 管理画面の origin と RP ID。 */
  readonly relyingParty: RelyingParty;
};

/** origin と RP ID を読めなかったことと、どの変数か。 */
export type InvalidRelyingParty = {
  /** どの結果か。 */
  readonly _tag: "Invalid";
  /** 誤りのある環境変数の名前。 */
  readonly variable: "AUTH_ORIGIN" | "AUTH_RP_ID";
  /** 読めなかった理由。 */
  readonly problem: string;
};

/** 環境変数の origin と RP ID の文字列。 */
export type RelyingPartyInput = {
  /** AUTH_ORIGIN の値。 */
  readonly origin: string;
  /** AUTH_RP_ID の値。 */
  readonly rpId: string;
};

const RP_ID = /^(?!-)[a-z0-9\-]+(?<!-)(?:\.(?!-)[a-z0-9\-]+(?<!-))*$/v;

const isLocalhost = (host: string): boolean =>
  host === "localhost" || host.endsWith(".localhost");

const findOriginProblem = (
  url: URL | null,
  origin: string,
): string | undefined => {
  if (url === null || url.origin !== origin) {
    return "https://example.com のように、パスや末尾の / を付けない origin で書く";
  }

  return url.protocol === "https:" ||
    (url.protocol === "http:" && isLocalhost(url.hostname))
    ? undefined
    : "https で書く(http は localhost だけ)";
};

/** 環境変数の origin と RP ID を読み、2つの組み合わせを確かめる。 */
export const parseRelyingParty = ({
  origin,
  rpId,
}: RelyingPartyInput): ParsedRelyingParty | InvalidRelyingParty => {
  const url = URL.parse(origin);
  const originProblem = findOriginProblem(url, origin);

  if (url === null || originProblem !== undefined) {
    return {
      _tag: "Invalid",
      variable: "AUTH_ORIGIN",
      problem: originProblem ?? "URL として読めない",
    };
  }

  if (!RP_ID.test(rpId)) {
    return {
      _tag: "Invalid",
      variable: "AUTH_RP_ID",
      problem: "小文字のドメインで書く(scheme・ポート・パスは付けない)",
    };
  }

  return url.hostname === rpId || url.hostname.endsWith(`.${rpId}`)
    ? { _tag: "Parsed", relyingParty: { origin, rpId } }
    : {
        _tag: "Invalid",
        variable: "AUTH_RP_ID",
        problem: "AUTH_ORIGIN のホストか、その上位のドメインで書く",
      };
};
