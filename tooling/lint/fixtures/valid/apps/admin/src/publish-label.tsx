/** 公開状態の文言に渡す値。 */
type PublishLabelProps = {
  /** 公開しているかどうか。 */
  readonly published: boolean;
};

/** 記事の公開状態の文言。 */
export const PublishLabel = ({ published }: PublishLabelProps) =>
  published ? <span>公開中</span> : <span>下書き</span>;
