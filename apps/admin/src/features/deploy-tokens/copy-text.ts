/** クリップボードに書いた結果。 */
export type CopyTextResult = {
  /** 結果の種類。 */
  readonly _tag: "Copied" | "Failed";
};

/** 文字列をクリップボードに書き、書けなければ(許可が無いなど)Failed を返す。 */
export const copyText = async (
  write: (text: string) => Promise<void>,
  text: string,
): Promise<CopyTextResult> => {
  try {
    await write(text);

    return { _tag: "Copied" };
  } catch {
    return { _tag: "Failed" };
  }
};
