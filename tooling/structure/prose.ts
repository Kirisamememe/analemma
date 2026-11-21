import { parseSync } from "oxc-parser";

import type { SourceFile } from "./source-file";

/** ファイルの中の、文書・コメント・文字列のひとまとまり。 */
export type Prose = {
  /** ひとまとまりの文。 */
  readonly text: string;
  /** 文が始まる行の、1から数えた番号。 */
  readonly line: number;
};

/** ファイルから取り出した文と、読めなかった理由。 */
export type ProseFile = {
  /** 取り出した文。 */
  readonly prose: readonly Prose[];
  /** ファイルを読めなかった理由。 */
  readonly errors: readonly string[];
};

const SOURCE = /\.(?:[cm]?[jt]s|[jt]sx)$/v;
/** 行の区切りとして数える改行。 */
export const LINE_BREAK = /\r\n|[\n\r\u2028\u2029]/v;
const FENCE_OPEN = /^\s*(?<fence>`{3,}|~{3,})/v;
const JSON_STRING = /"(?:[^"\\\n]|\\.)*"/gv;

const lineAt = (text: string, index: number): number =>
  text.slice(0, index).split(LINE_BREAK).length;

const blank = (text: string): string => text.replaceAll(/[^\n\r]/gv, " ");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isClosingFence = (line: string, fence: string): boolean => {
  const trimmed = line.trim();

  return (
    trimmed.length >= fence.length &&
    trimmed.replaceAll(fence.at(0) ?? "", "") === ""
  );
};

const blankCodeBlocks = (markdown: string): string => {
  let fence: string | undefined;

  return markdown
    .split("\n")
    .map((line) => {
      if (fence === undefined) {
        fence = FENCE_OPEN.exec(line)?.groups?.["fence"];

        return fence === undefined ? line : blank(line);
      }

      if (isClosingFence(line, fence)) {
        fence = undefined;
      }

      return blank(line);
    })
    .join("\n");
};

const nodeProse = (node: Record<string, unknown>, source: string): Prose[] => {
  const { start, end, type, value } = node;

  if (typeof start !== "number" || typeof end !== "number") {
    return [];
  }

  if (type === "Literal" && typeof value === "string") {
    return [
      { text: source.slice(start + 1, end - 1), line: lineAt(source, start) },
    ];
  }

  if (type === "TemplateElement" && isRecord(value)) {
    const { raw } = value;

    return typeof raw === "string"
      ? [{ text: raw, line: lineAt(source, start + 1) }]
      : [];
  }

  return type === "JSXText" && typeof value === "string"
    ? [{ text: value, line: lineAt(source, start) }]
    : [];
};

const stringProse = (node: unknown, source: string): Prose[] => {
  if (Array.isArray(node)) {
    return node.flatMap((child: unknown) => stringProse(child, source));
  }

  return isRecord(node)
    ? [
        ...nodeProse(node, source),
        ...Object.values(node).flatMap((child) => stringProse(child, source)),
      ]
    : [];
};

const sourceProse = ({ path, text }: SourceFile): ProseFile => {
  const { comments, errors, program } = parseSync(path, text);

  return {
    prose: [
      ...comments.map(({ start, value }) => ({
        text: value,
        line: lineAt(text, start),
      })),
      ...stringProse(program, text),
    ],
    errors: errors.map(({ message }) => `構文を読めない:${message}`),
  };
};

const jsonProse = (text: string): ProseFile => ({
  prose: [...text.matchAll(JSON_STRING)].map((match) => ({
    text: match[0].slice(1, -1),
    line: lineAt(text, match.index),
  })),
  errors: [],
});

/** 文書・コメント・文字列を取り出せるファイルかを見分ける。 */
export const hasProse = (path: string): boolean =>
  path.endsWith(".md") || path.endsWith(".json") || SOURCE.test(path);

/** ファイルの中身から、文書・コメント・文字列を取り出す。 */
export const extractProse = (file: SourceFile): ProseFile => {
  if (file.path.endsWith(".md")) {
    return {
      prose: [{ text: blankCodeBlocks(file.text), line: 1 }],
      errors: [],
    };
  }

  if (SOURCE.test(file.path)) {
    return sourceProse(file);
  }

  return file.path.endsWith(".json")
    ? jsonProse(file.text)
    : { prose: [], errors: [] };
};
