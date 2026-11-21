import type { Plugin, Rule } from "@commitlint/types";

const HEADER_MAX_WIDTH = 100;
const JAPANESE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/v;

/** 1行目の幅を、半角に換算して100文字までにするルール。 */
const headerMaxWidth: Rule = ({ header }) => {
  const width = Bun.stringWidth(header ?? "");

  return [
    width <= HEADER_MAX_WIDTH,
    `1行目は、半角に換算して ${String(HEADER_MAX_WIDTH)} 文字までにする(全角の文字は2文字と数える。今は ${String(width)} 文字)`,
  ];
};

/** 件名に日本語を求めるルール。 */
const subjectJapanese: Rule = ({ subject }) => [
  typeof subject !== "string" || JAPANESE.test(subject),
  "件名は日本語で書く(ひらがな・カタカナ・漢字を含める)",
];

/** このリポジトリで commitlint に足したルール。 */
export const commitlintRules: Plugin = {
  rules: {
    "header-max-width": headerMaxWidth,
    "subject-japanese": subjectJapanese,
  },
};
