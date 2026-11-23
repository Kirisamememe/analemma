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

type ViewerActionsProps = {
  /** 表示と URL の画像が異なり、操作を受け付けないか。 */
  disabled: boolean;
  /** 画像を操作するボタン。 */
  children: ReactNode;
};

/** 写真を送る間、見た目を保って画像の変更を止める操作。 */
export const ViewerActions = ({
  disabled,
  children,
}: ViewerActionsProps): ReactNode => (
  <fieldset disabled={disabled} className="contents">
    {children}
  </fieldset>
);
