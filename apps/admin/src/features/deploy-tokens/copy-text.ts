/** クリップボードに書いた結果。 */
export type CopyTextResult = {
  /** どの結果か。 */
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
