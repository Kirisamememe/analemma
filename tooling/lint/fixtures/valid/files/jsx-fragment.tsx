/** 記事の公開した日の表示に渡す値。 */
type PublishedDateProps = {
  /** 公開した日。 */
  readonly date: string;
};

/** 記事の公開した日。 */
export const PublishedDate = ({ date }: PublishedDateProps) => (
  <>公開した日:{date}</>
);
