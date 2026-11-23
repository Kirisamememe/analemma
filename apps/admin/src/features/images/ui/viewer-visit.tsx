import type { ReactNode, Ref } from "react";

type ViewerVisitProps = {
  /** 写真を送る向き。 */
  direction: "previous" | "next" | undefined;
  /** 写真と前後のリンクが描かれた範囲。 */
  ref: Ref<HTMLDivElement>;
  /** 写真と情報の欄。 */
  children: ReactNode;
};

/** 写真と情報の欄を囲み、写真を送る向きを伝える範囲。 */
export const ViewerVisit = ({
  direction,
  children,
  ref,
}: ViewerVisitProps): ReactNode => (
  <div className="contents" data-photo-direction={direction} ref={ref}>
    {children}
  </div>
);
