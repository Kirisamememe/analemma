import type { ComponentProps, ReactNode } from "react";

type ViewerVisitProps = Pick<ComponentProps<"div">, "children" | "ref"> & {
  /** 写真を送る向き。 */
  direction: "previous" | "next" | undefined;
};

/** 写真と情報の欄を囲み、写真を送る向きを伝える範囲。 */
export const ViewerVisit = ({
  direction,
  ref,
  children,
}: ViewerVisitProps): ReactNode => (
  <div className="contents" data-photo-direction={direction} ref={ref}>
    {children}
  </div>
);
