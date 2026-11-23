import type { ReactNode, Ref } from "react";

type ViewerVisitProps = {
  /** 写真と前後のリンクが描かれた範囲。 */
  ref: Ref<HTMLDivElement>;
  /** 写真と情報の欄。 */
  children: ReactNode;
};

/** 写真と前後のリンクを描き終えたことを伝える範囲。 */
export const ViewerVisit = ({ children, ref }: ViewerVisitProps): ReactNode => (
  <div className="contents" ref={ref}>
    {children}
  </div>
);
