/**
 * 記事の公開状態。
 * @deprecated 代わりに PublicationState を使う。
 */
export type Status = "draft" | "published";

/** 予約を含めた、記事の公開状態。 */
export type PublicationState = "draft" | "published" | "scheduled";

/** `if` と `when` を名前に持つ値。 */
export type Keyword = "if" | "when";
