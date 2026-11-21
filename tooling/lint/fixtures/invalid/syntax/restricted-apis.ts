/** 記事の題を持つ値。 */
type Draft = {
  /** 記事の題。 */
  title: string;
};

/** 下書きの題を書き換える。 */
export const rename = (draft: Draft): void => {
  console.log(process.env["TITLE"]);
  draft.title = "題";
};
