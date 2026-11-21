/**
 * 記事の題と本文から、一覧に出す要約を作る。
 * @param title 記事の題。
 * @param body 記事の本文。
 * @returns 一覧に出す要約。
 */
export const summarize = (title: string, body: string): string =>
  `${title}: ${body.slice(0, 10)}`;
