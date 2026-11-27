/** 公開状態の文言に渡す値。 */
type PublishLabelProps = {
  /** 公開しているかどうか。 */
  readonly published: boolean;
  /** 公開中と下書きの文言。 */
  readonly labels: Readonly<Record<"published" | "draft", string>>;
};

/** 記事の公開状態の文言。 */
export const PublishLabel = ({ published, labels }: PublishLabelProps) =>
  published ? <span>{labels.published}</span> : <span>{labels.draft}</span>;
