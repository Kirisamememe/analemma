import type { ReactNode, Ref } from "react";

type SnapItemProps = {
  /** 左端に止める中身。 */
  children: ReactNode;
  /** 止める要素(大きさや位置を測るときに使う)。 */
  ref?: Ref<HTMLDivElement> | undefined;
};

/** `snap` を付けた ScrollView の中で、領域の左端に止まる1つ分。 */
export const SnapItem = ({ children, ref }: SnapItemProps): ReactNode => (
  <div className="relative flex-none snap-start" ref={ref}>
    {children}
  </div>
);
