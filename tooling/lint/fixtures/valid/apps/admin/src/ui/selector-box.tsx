import { merge } from "./tv";

/** 中身の class を受け取る箱に渡す値。 */
type BoxProps = {
  /** 中身の class。 */
  readonly contentClassName: string;
};

/** 中身の class を受け取る箱。 */
export const Box = ({ contentClassName }: BoxProps) => (
  <div className={merge(contentClassName)} />
);
