/** 記事が見つかった結果。 */
type Found = {
  /** 結果の種類。 */
  readonly _tag: "Found";
  /** 記事の題。 */
  readonly title: string;
};

/** 記事が見つからなかった結果。 */
type NotFound = {
  /** 結果の種類。 */
  readonly _tag: "NotFound";
};

/** 記事を探した結果。 */
export type FindResult = Found | NotFound;

/** 探した結果を文言にする。 */
export const describeResult = (result: FindResult): string =>
  result._tag === "Found" ? result.title : "見つかりません";
