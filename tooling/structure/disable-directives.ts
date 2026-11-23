/** 抑制のコメントの形。 */
export type DirectiveKind = "disable" | "disable-line" | "disable-next-line";

/** 抑制のコメントを読んだ結果。 */
export type DisableDirective = {
  /** 抑制の形。 */
  readonly kind: DirectiveKind;
  /** 抑制するルールの名前。 */
  readonly rules: readonly string[];
  /** `--` の後に書いた理由。 */
  readonly reason: string;
};

/** ルールの名前と、照らし合わせるルール。 */
export type RuleMatch = {
  /** 抑制のコメントに書いたルールの名前。 */
  readonly token: string;
  /** プラグイン名から書いたルールの名前。 */
  readonly rule: string;
};

const DIRECTIVE =
  /^\s*(?:oxlint|eslint)-(?<kind>disable(?:-next-line|-line)?)(?=\s|$)(?<rest>[\s\S]*)$/v;

const KINDS = new Map<string, DirectiveKind>([
  ["disable", "disable"],
  ["disable-line", "disable-line"],
  ["disable-next-line", "disable-next-line"],
]);

const isWhitespace = (character: string | undefined): boolean =>
  character !== undefined && /\s/v.test(character);

const findDescriptionStart = (text: string): number => {
  for (let index = 0; index < text.length; index += 1) {
    const next = text[index + 1];

    if (
      text[index] === "-" &&
      (next === "-" || (isWhitespace(text[index - 1]) && isWhitespace(next)))
    ) {
      return index;
    }
  }

  return -1;
};

/** コメントの本文を、抑制のコメントとして読む。 */
export const parseDisableDirective = (
  value: string,
): DisableDirective | undefined => {
  const groups = DIRECTIVE.exec(value)?.groups;
  const kind = KINDS.get(groups?.["kind"] ?? "");

  if (kind === undefined) {
    return undefined;
  }

  const rest = groups?.["rest"] ?? "";
  const descriptionStart = findDescriptionStart(rest);

  const rulesText =
    descriptionStart === -1 ? rest : rest.slice(0, descriptionStart);

  const description =
    descriptionStart === -1 ? "" : rest.slice(descriptionStart);

  return {
    kind,
    reason: description.startsWith("--") ? description.slice(2).trim() : "",
    rules: rulesText.split(/[\s,]+/v).filter((rule) => rule !== ""),
  };
};

/** 抑制のコメントに書いた名前が、あるルールを指すかを見分ける。 */
export const matchesRule = ({ rule, token }: RuleMatch): boolean =>
  token.includes("/") ? token === rule : rule.split("/").at(-1) === token;
