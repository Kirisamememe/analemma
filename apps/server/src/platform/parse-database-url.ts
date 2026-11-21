import type { DatabaseTarget } from "./database";

/** DATABASE_URL から読み取れた接続先。 */
export type ParsedDatabaseUrl = {
  /** 結果の種類。 */
  readonly _tag: "Parsed";
  /** つなぐ DB と、つなぐときのロール。 */
  readonly target: DatabaseTarget;
};

/** DATABASE_URL を読めなかったこと。 */
export type InvalidDatabaseUrl = {
  /** 結果の種類。 */
  readonly _tag: "Invalid";
  /** 読めなかった理由。 */
  readonly problem: string;
};

const DEFAULT_POSTGRES_PORT = 5432;
const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

const decode = (text: string): string | undefined => {
  try {
    return decodeURIComponent(text);
  } catch {
    return undefined; // 不正な % の並びは、URL の誤りにする
  }
};

const findProblem = (url: URL): string | undefined => {
  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    return "postgres:// か postgresql:// で始める";
  }

  if (url.hostname === "" || url.hostname.includes(",")) {
    return "接続先のホストを1つだけ書く";
  }

  if (url.port === "0") {
    return "ポートは 1〜65535 で書く";
  }

  if (url.search !== "" || url.hash !== "") {
    return "? や # の後ろは書けない(パスワードの # は %23 と書く)";
  }

  if (url.username === "" || url.password === "") {
    return "ロールとパスワードを書く";
  }

  return /^\/[^\/]+$/v.test(url.pathname) ? undefined : "DB の名前を1つ書く";
};

/** DATABASE_URL を、つなぐ DB とロールに分けて読む。 */
export const parseDatabaseUrl = (
  value: string,
): ParsedDatabaseUrl | InvalidDatabaseUrl => {
  const url = URL.parse(value);
  const problem = url === null ? "URL として読めない" : findProblem(url);

  if (url === null || problem !== undefined) {
    return { _tag: "Invalid", problem: problem ?? "URL として読めない" };
  }

  const database = decode(url.pathname.slice(1));
  const username = decode(url.username);
  const password = decode(url.password);

  return database === undefined ||
    username === undefined ||
    password === undefined
    ? { _tag: "Invalid", problem: "% の書き方が正しくない" }
    : {
        _tag: "Parsed",
        target: {
          host: url.hostname,
          port: url.port === "" ? DEFAULT_POSTGRES_PORT : Number(url.port),
          database,
          username,
          password,
        },
      };
};
