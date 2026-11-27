/** 公開状態の表示に渡す値。 */
type StatusBadgeProps = {
  /** 公開しているかどうか。 */
  readonly published: boolean;
  /** 公開中と下書きの文言。 */
  readonly labels: Readonly<Record<"published" | "draft", string>>;
};

/** 記事の公開状態の表示。 */
export const StatusBadge = ({ published, labels }: StatusBadgeProps) =>
  published ? <span>{labels.published}</span> : <span>{labels.draft}</span>;
