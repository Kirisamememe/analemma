import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const iconButton = tv({
  base: [
    "flex size-10 shrink-0 items-center justify-center",
    "rounded-control text-fg outline-hidden transition",
    "is-hovered:state-hover is-focus-shown:focus-ring is-pressed:state-pressed is-disabled:state-disabled",
  ],
});

const drawer = tv({
  slots: {
    overlay: [
      "fixed top-0 left-0 z-overlay flex h-(--visual-viewport-height) w-full",
      "dialog-backdrop-animation bg-scrim/40",
    ],
    panel: [
      "h-full w-sidebar max-w-full overflow-y-auto",
      "nav-drawer-panel-animation rounded-e-surface bg-surface-sunken text-fg shadow-overlay edge-outer",
    ],
  },
});

const { overlay, panel } = drawer();

/** ナビの drawer に渡す値。 */
export type NavDrawerProps = {
  /** Dialog の名前。 */
  label: string;
  /** 開くボタンの、アクセシブルな名前。 */
  openLabel: string;
  /** 閉じるボタンの、アクセシブルな名前。 */
  closeLabel: string;
  /** 閉じるボタンと並べて、上の段に描く見出し。 */
  heading: ReactNode;
  /** 開いているか。 */
  isOpen: boolean;
  /** 送信中か。 */
  isPending?: boolean;
  /** 開け閉めを知らせる関数。 */
  onOpenChange: (isOpen: boolean) => void;
  /** drawer の中身。 */
  children: ReactNode;
};

/** ナビを左から引き出す drawer。 */
export const NavDrawer = ({
  label,
  openLabel,
  closeLabel,
  heading,
  isOpen,
  isPending = false,
  onOpenChange,
  children,
}: NavDrawerProps): ReactNode => (
  <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
    <AriaButton aria-label={openLabel} className={iconButton()}>
      <Icon name="menu" />
    </AriaButton>
    <ModalOverlay
      className={overlay()}
      isDismissable={isOpen && !isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <Modal className={panel()}>
        <Dialog
          aria-label={label}
          className="flex min-h-full flex-col outline-hidden"
          inert={!isOpen}
        >
          <div className="flex h-nav-bar shrink-0 items-center gap-2 px-3">
            <AriaButton
              aria-label={closeLabel}
              className={iconButton()}
              isDisabled={isPending}
              slot="close"
            >
              <Icon name="x" />
            </AriaButton>
            {heading}
          </div>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>
);
