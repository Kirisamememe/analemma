import type { ReactNode, Ref } from "react";

type ModalSectionProps = {
  /** 欄の中身。 */
  children: ReactNode;
  /** 描画した欄を参照する。 */
  ref?: Ref<HTMLDivElement>;
};

/** モーダルの見出しと左右をそろえる欄。 */
export const ModalSection = ({
  children,
  ref,
}: ModalSectionProps): ReactNode => (
  <div ref={ref} className="px-panel">
    {children}
  </div>
);
