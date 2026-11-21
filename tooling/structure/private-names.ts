import { LINE_BREAK } from "./prose";

/** 文字列の中で見つけた、ほかのリポジトリの名前。 */
export type PrivateNameFinding = {
  /** 一覧に書いた名前。 */
  readonly name: string;
  /** 1から数えた行の番号。 */
  readonly line: number;
};

/** ほかのリポジトリの名前を探すための入力。 */
export type PrivateNameSearch = {
  /** 手元だけの一覧から読んだ名前。 */
  readonly names: readonly string[];
  /** 探す文字列。 */
  readonly text: string;
};

const COMMENT = "#";
const ASCII_WORD = /[A-Za-z0-9]/v;

const isWordCharacter = (character: string | undefined): boolean =>
  character !== undefined && ASCII_WORD.test(character);

const startsWord = (name: string, before: string | undefined): boolean =>
  isWordCharacter(name[0]) && isWordCharacter(before);

const endsWord = (name: string, after: string | undefined): boolean =>
  isWordCharacter(name.at(-1)) && isWordCharacter(after);

/** 手元だけの一覧から、探す名前を読む。 */
export const readPrivateNames = (list: string): string[] =>
  list
    .split(LINE_BREAK)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith(COMMENT));

/** 文字列の中から、ほかのリポジトリの名前を探す。 */
export const findPrivateNames = ({
  names,
  text,
}: PrivateNameSearch): PrivateNameFinding[] => {
  const lowered = text.toLowerCase();
  const found: PrivateNameFinding[] = [];

  for (const name of names) {
    const target = name.toLowerCase();

    for (
      let index = lowered.indexOf(target);
      index !== -1;
      index = lowered.indexOf(target, index + 1)
    ) {
      if (
        !startsWord(target, lowered[index - 1]) &&
        !endsWord(target, lowered[index + target.length])
      ) {
        found.push({
          name,
          line: lowered.slice(0, index).split(LINE_BREAK).length,
        });
      }
    }
  }

  return found;
};
