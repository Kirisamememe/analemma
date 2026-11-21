/** 題の表示に渡す値。 */
type TitleProps = {
  /** 表示する題。 */
  readonly title: string;
};

/** 記事の題の表示。 */
export const Title = ({ title }: TitleProps) => <h1>{title}</h1>;
