import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type OverlayLayerProps = {
  /** 案内を重ねる要素。 */
  container?: HTMLElement | undefined;
  /** 背後の操作を妨げずに見せる案内。 */
  children: ReactNode;
};

/** 指定した要素の内側いっぱいに案内を重ねる。 */
export const OverlayLayer = ({
  container,
  children,
}: OverlayLayerProps): ReactNode => {
  const layer = (
    <div className="pointer-events-none absolute inset-0 z-overlay">
      {children}
    </div>
  );

  return container ? createPortal(layer, container) : layer;
};
