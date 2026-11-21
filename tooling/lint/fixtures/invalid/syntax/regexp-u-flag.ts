/** ひらがなだけの文字列を見分ける。 */
export const isHiragana = (text: string): boolean =>
  /^\p{Script=Hiragana}+$/u.test(text);
