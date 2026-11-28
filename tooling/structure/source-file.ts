import { parseSync } from "oxc-parser";

import { RULE_EXEMPTIONS } from "../lint/config/rule-exemptions";
import { isDisableDirective } from "./disable-directives";

/** ルールを外すファイルの一覧に無ければ越えられない、コードの行数。 */
export const SOFT_LIMIT = 400;

/** 理由があっても越えられない、コードの行数。 */
export const HARD_LIMIT = 800;

/** 400行を超えるファイルを、ルールを外すファイルの一覧で外すルール。 */
export const SOFT_LIMIT_RULE = "project/max-code-lines";

/** 一覧でも外せないルール。 */
export const PROTECTED_RULES = [
  "project/file-length-limit",
  "project/no-standalone-comment",
  "project/no-lint-suppression",
];

/** ルールを外すファイルの一覧にある、400行を超えてよいファイル。 */
export const LONG_FILES: ReadonlySet<string> = new Set(
  RULE_EXEMPTIONS.filter(({ rule }) => rule === SOFT_LIMIT_RULE).flatMap(
    ({ files }) => files,
  ),
);

/** 検査するソースのファイル。 */
export type SourceFile = {
  /** リポジトリの直下から数えたパス。 */
  readonly path: string;
  /** ファイルの中身。 */
  readonly text: string;
};

/** ソースのファイルの中のコメント。 */
type Comment = {
  /** コメントの形。 */
  readonly type: "Block" | "Line";
  /** `//` や `/*` を除いた本文。 */
  readonly value: string;
  /** 始まりの位置。 */
  readonly start: number;
  /** 終わりの位置。 */
  readonly end: number;
};

const BOM = /^\uFEFF/v;
const DIVIDER_LINE = /^\s*-{10,}\s*$/v;
const HAS_WORD = /[\p{L}\p{N}]/v;

const blankOutComments = (text: string, comments: readonly Comment[]) =>
  comments.reduce(
    (blanked, comment) =>
      blanked.slice(0, comment.start) +
      blanked
        .slice(comment.start, comment.end)
        .replaceAll(/[^\n\r\p{Zl}\p{Zp}]/gv, (character) =>
          " ".repeat(character.length),
        ) +
      blanked.slice(comment.end),
    text,
  );

const splitLines = (text: string): string[] =>
  text.replaceAll("\r\n", "\n").split(/[\n\r\p{Zl}\p{Zp}]/v);

const countCodeLines = (text: string, comments: readonly Comment[]): number =>
  splitLines(blankOutComments(text, comments)).filter(
    (line) => line.trim() !== "",
  ).length;

const lineNumberOf = (text: string, index: number): number =>
  splitLines(text.slice(0, index)).length;

const isStandaloneLine = (text: string, comment: Comment): boolean => {
  const before = splitLines(text.slice(0, comment.start)).at(-1) ?? "";

  return comment.type === "Line" && before.trim() === "";
};

const isTitle = (comment: Comment): boolean =>
  !DIVIDER_LINE.test(comment.value) &&
  HAS_WORD.test(comment.value) &&
  !isDisableDirective(comment.value);

const hasDividerFollowedByCode = (
  text: string,
  comments: readonly Comment[],
): boolean => {
  const blanked = blankOutComments(text, comments);
  const lines = comments.filter((comment) => isStandaloneLine(text, comment));

  return lines.some((top, index) => {
    const title = lines[index + 1];
    const bottom = lines[index + 2];

    return (
      title !== undefined &&
      bottom !== undefined &&
      DIVIDER_LINE.test(top.value) &&
      isTitle(title) &&
      DIVIDER_LINE.test(bottom.value) &&
      lineNumberOf(text, title.start) === lineNumberOf(text, top.start) + 1 &&
      lineNumberOf(text, bottom.start) === lineNumberOf(text, top.start) + 2 &&
      blanked.slice(bottom.end).trim() !== ""
    );
  });
};

const directiveProblems = (comments: readonly Comment[]): string[] =>
  comments.some((comment) => isDisableDirective(comment.value))
    ? ["lint を抑制するコメントがある"]
    : [];

/** ソースのファイル1つについて、抑制のコメントに左右されない約束の違反を集める。 */
export const checkSourceFile = (
  { path, text: source }: SourceFile,
  longFiles: ReadonlySet<string> = LONG_FILES,
): string[] => {
  const text = source.replace(BOM, "");
  const comments: readonly Comment[] = parseSync(path, text).comments;
  const lines = countCodeLines(text, comments);

  const lengthProblems =
    lines > HARD_LIMIT
      ? [
          `コードが ${String(lines)} 行あり、${String(HARD_LIMIT)} 行を超えている`,
        ]
      : [];

  const exceptionProblems =
    lines > SOFT_LIMIT
      ? [
          ...(longFiles.has(path)
            ? []
            : [
                `コードが ${String(SOFT_LIMIT)} 行を超えるのに、ルールを外すファイルの一覧に無い`,
              ]),
          ...(hasDividerFollowedByCode(text, comments)
            ? []
            : [
                `コードが ${String(SOFT_LIMIT)} 行を超えるのに、後ろにコードが続く分割の見出しが無い`,
              ]),
        ]
      : [];

  return [
    ...lengthProblems,
    ...exceptionProblems,
    ...directiveProblems(comments),
  ];
};
