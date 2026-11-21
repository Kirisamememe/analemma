import { formatPushResult } from "./format-push-result";
import { pushKindDefinitions } from "./push-kind-definitions";
import { readCliArgs } from "./read-cli-args";
import { readKindDefinitions } from "./read-kind-definitions";

/** CLI が外とやり取りするための値と関数。 */
export type CliIo = {
  /** コマンドの引数(`node` とスクリプトのパスを除く)。 */
  readonly args: readonly string[];
  /** 環境変数 `ANALEMMA_URL` の値。 */
  readonly url: string | undefined;
  /** 環境変数 `ANALEMMA_DEPLOY_TOKEN` の値。 */
  readonly token: string | undefined;
  /** 定義のファイルを読み込む関数。 */
  readonly loadModule: (path: string) => Promise<unknown>;
  /** リクエストに使う fetch。 */
  readonly fetch: (request: Request) => Promise<Response>;
  /** 標準出力に1行を書く関数。 */
  readonly write: (line: string) => void;
  /** 標準エラーに1行を書く関数。 */
  readonly writeError: (line: string) => void;
};

const USAGE = [
  "使い方: analemma push-kinds <定義のファイル> [--url <CMS の内部用のポートの URL>]",
  "環境変数: ANALEMMA_DEPLOY_TOKEN(デプロイ用のトークン)、ANALEMMA_URL(--url を省いたときの URL)",
];

const EXIT_REJECTED = 1;
const EXIT_USAGE = 2;

const writeLines = (
  write: (line: string) => void,
  lines: readonly string[],
): void => {
  for (const line of lines) {
    write(line);
  }
};

const TOKEN = /^[\w\-]{22}\.[\w\-]{43}$/v;

const isHttpUrl = (value: string): boolean =>
  URL.canParse(value) && /^https?:$/v.test(new URL(value).protocol);

/** `analemma` のコマンドを流し、終了コードを返す。 */
export const runCli = async (io: CliIo): Promise<number> => {
  const args = readCliArgs(io.args);

  if (args._tag === "Misused") {
    writeLines(io.writeError, USAGE);

    return EXIT_USAGE;
  }

  const url = args.url ?? io.url;

  if (url === undefined || !isHttpUrl(url)) {
    writeLines(io.writeError, [
      "CMS の URL を、http か https で渡す。",
      ...USAGE,
    ]);

    return EXIT_USAGE;
  }

  if (io.token === undefined || !TOKEN.test(io.token)) {
    writeLines(io.writeError, [
      "ANALEMMA_DEPLOY_TOKEN に、管理画面で発行したデプロイ用のトークンを入れる。",
      ...USAGE,
    ]);

    return EXIT_USAGE;
  }

  const token = io.token;
  const read = readKindDefinitions(await io.loadModule(args.file));

  if (read._tag === "Unreadable") {
    io.writeError(`種類の定義を読めない。\n${read.problem}`);

    return EXIT_REJECTED;
  }

  const result = await pushKindDefinitions({
    url,
    token,
    kinds: read.kinds,
    fetch: io.fetch,
  });
  const lines = formatPushResult(result);

  if (result._tag === "Accepted") {
    writeLines(io.write, lines);

    return 0;
  }

  writeLines(io.writeError, lines);

  return EXIT_REJECTED;
};
