/** 公開状態の表示に渡す値。 */
type StatusBadgeProps = {
  /** 公開しているかどうか。 */
  readonly published: boolean;
};

/** 記事の公開状態の表示。 */
export const StatusBadge = ({ published }: StatusBadgeProps) =>
  published ? <span>公開中</span> : <span>下書き</span>;
