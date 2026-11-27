import type { ReactNode } from "react";
import { Modal, ModalOverlay } from "react-aria-components";

import { overlayPanel } from "./overlay-panel-style";

import { tv } from "@/ui/tv";

const frame = tv({
  slots: {
    backdrop: [
      "fixed top-0 left-0 z-overlay h-(--visual-viewport-height) w-full p-4",
      "flex items-center justify-center",
      "dialog-backdrop-animation bg-scrim/40",
    ],
    panel: [
      "max-h-full w-full rounded-surface",
      "dialog-panel-animation",
      overlayPanel(),
    ],
  },
  variants: {
    size: {
      dialog: { panel: "max-w-md overflow-y-auto p-6" },
      status: { panel: "relative w-80 max-w-full overflow-y-auto p-2" },
      form: { panel: "relative flex max-w-form flex-col overflow-hidden" },
      page: {
        panel: "@container relative flex max-w-page flex-col overflow-hidden",
      },
    },
  },
});

/** `OverlayFrame` に渡す値。 */
type OverlayFrameProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 開け閉めを知らせる関数。 */
  onOpenChange: (isOpen: boolean) => void;
  /** Escape と backdrop の押下で閉じないか。 */
  isLocked: boolean;
  /** backdrop の押下で閉じるか。 */
  isDismissable?: boolean | undefined;
  /** backdrop を押しても、パネルから focus を外さないか。 */
  isFocusHeld?: boolean;
  /** パネルの幅と、中身のはみ出しの扱い。 */
  size: "dialog" | "status" | "form" | "page";
  /** パネルの中身。 */
  children: ReactNode;
};

/** 画面を backdrop で覆い、その中央にパネルを浮かべる枠。 */
export const OverlayFrame = ({
  isOpen,
  onOpenChange,
  isLocked,
  isDismissable = true,
  isFocusHeld = false,
  size,
  children,
}: OverlayFrameProps): ReactNode => {
  const { backdrop, panel } = frame({ size });

  return (
    <ModalOverlay
      className={backdrop()}
      onPointerDownCapture={(event) => {
        if (isFocusHeld && event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
      isDismissable={isOpen && !isLocked && isDismissable}
      isKeyboardDismissDisabled={isLocked}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal className={panel()}>{children}</Modal>
    </ModalOverlay>
  );
};
