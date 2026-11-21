/** 公開状態の表示に渡す値。 */
type StatusProps = {
  /** 公開しているかどうか。 */
  readonly published: boolean;
};

/** 記事の公開状態の表示。 */
export const Status = ({ published }: StatusProps) =>
  published ? <span>公開中</span> : <span>下書き</span>;
