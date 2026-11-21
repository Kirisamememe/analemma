import type { Glossary } from "./glossary";
import { LINE_BREAK, type Prose } from "./prose";

/** 文の中で見つけた、使わない表記。 */
export type GlossaryFinding = {
  /** 見つけた表記。 */
  readonly term: string;
  /** 代わりに使う表記。 */
  readonly replacement: string;
  /** 1から数えた行の番号。 */
  readonly line: number;
};

/** 使わない表記を探すための入力。 */
export type GlossarySearch = {
  /** リポジトリの直下から数えたパス。 */
  readonly path: string;
  /** ファイルから取り出した文。 */
  readonly prose: readonly Prose[];
  /** 読んだ用語集。 */
  readonly glossary: Glossary;
};

/** 文の中の1か所。 */
type Position = {
  /** 探した文。 */
  readonly text: string;
  /** 文の中の位置。 */
  readonly index: number;
  /** その位置で見つけた語。 */
  readonly term: string;
};

const CODE_SPAN = /(?<tick>`+)[^\n]*?\k<tick>/gv;
const WORD_CHARACTER = /[A-Za-z0-9_]/v;
const ASCII_WORD = /^[A-Za-z0-9]/v;
const JOINERS = new Set(["-", ".", "/"]);
const OPEN_QUOTE = "「";
const CLOSE_QUOTE = "」";

const blank = (text: string): string => text.replaceAll(/[^\n\r]/gv, " ");

const maskQuotes = (text: string): string => {
  let depth = 0;

  return text.replaceAll(/[\s\S]/gv, (character) => {
    if (LINE_BREAK.test(character)) {
      depth = 0;

      return character;
    }

    const quoted = depth > 0 || character === OPEN_QUOTE;

    depth += character === OPEN_QUOTE ? 1 : 0;
    depth -= character === CLOSE_QUOTE && depth > 0 ? 1 : 0;

    return quoted ? " ".repeat(character.length) : character;
  });
};

const occurrences = (text: string, term: string): number[] => {
  const found: number[] = [];

  for (
    let index = text.indexOf(term);
    index !== -1;
    index = text.indexOf(term, index + 1)
  ) {
    found.push(index);
  }

  return found;
};

const isWordCharacter = (character: string | undefined): boolean =>
  character !== undefined && WORD_CHARACTER.test(character);

const isJoined = (near: string | undefined, beyond: string | undefined) =>
  isWordCharacter(near) ||
  (near !== undefined && JOINERS.has(near) && isWordCharacter(beyond));

const standsAlone = ({ index, term, text }: Position): boolean => {
  const end = index + term.length;
  const joinedBefore =
    ASCII_WORD.test(term) && isJoined(text[index - 1], text[index - 2]);
  const joinedAfter =
    ASCII_WORD.test(term.at(-1) ?? "") && isJoined(text[end], text[end + 1]);

  return !joinedBefore && !joinedAfter;
};

const lineWithin = (text: string, index: number): number =>
  text.slice(0, index).split(LINE_BREAK).length;

/** ファイルから取り出した文の中から、用語集で使わないと決めた表記を探す。 */
export const findBannedTerms = ({
  glossary,
  path,
  prose,
}: GlossarySearch): GlossaryFinding[] => {
  const terms = glossary.banned.filter(
    ({ scopes }) =>
      scopes.length === 0 || scopes.some((scope) => path.startsWith(scope)),
  );
  const found = new Map<string, GlossaryFinding>();

  for (const [part, { line, text }] of prose.entries()) {
    const masked = maskQuotes(
      text.replaceAll(CODE_SPAN, (span) => blank(span)),
    );

    for (const { term, replacement } of terms) {
      for (const index of occurrences(masked, term)) {
        const position = { index, term, text: masked };
        const key = `${String(part)}:${String(index)}:${term}`;

        if (!found.has(key) && standsAlone(position)) {
          found.set(key, {
            term,
            replacement,
            line: line + lineWithin(masked, index) - 1,
          });
        }
      }
    }
  }

  return [...found.values()].toSorted((left, right) => left.line - right.line);
};
