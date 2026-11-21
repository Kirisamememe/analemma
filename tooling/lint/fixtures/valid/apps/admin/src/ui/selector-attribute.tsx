import { merge } from "./tv";

/** 中身の class を受け取る箱に渡す値。 */
type BoxProps = {
  /** 中身の class。 */
  readonly contentClassName: string;
};

const Box = ({ contentClassName }: BoxProps) => (
  <div className={merge(contentClassName)} />
);

/** 名前が ClassName で終わる属性に渡した class。 */
export const Panel = () => <Box contentClassName="p-4" />;
