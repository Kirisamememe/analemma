import type { ReactNode } from "react";

/** 画像を操作するボタンの並びに渡す値。 */
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
