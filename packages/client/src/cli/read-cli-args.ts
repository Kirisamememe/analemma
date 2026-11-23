import { parseArgs } from "node:util";

/** 種類の定義を送るコマンドの引数。 */
export type PushArgs = {
  /** どの結果か。 */
  readonly _tag: "Push";
  /** 定義のファイルのパス。 */
  readonly file: string;
  /** `--url` で渡した CMS の URL。 */
  readonly url: string | undefined;
};

/** 引数が、使い方に合わないこと。 */
export type MisusedArgs = {
  /** どの結果か。 */
  readonly _tag: "Misused";
};

/** `analemma` のコマンドの引数を読む。 */
export const readCliArgs = (
  args: readonly string[],
): PushArgs | MisusedArgs => {
  const { positionals, tokens, values } = parseArgs({
    args: [...args],
    allowPositionals: true,
    strict: false,
    tokens: true,
    options: { url: { type: "string" } },
  });

  const [command, file, ...rest] = positionals;
  const options = tokens.filter((token) => token.kind === "option");

  const misusedOption =
    options.length > 1 ||
    options.some(
      (option) =>
        option.name !== "url" ||
        option.value === undefined ||
        option.value.startsWith("-"),
    );

  if (
    command !== "push-kinds" ||
    file === undefined ||
    rest.length > 0 ||
    misusedOption
  ) {
    return { _tag: "Misused" };
  }

  return {
    _tag: "Push",
    file,
    url: typeof values.url === "string" ? values.url : undefined,
  };
};
