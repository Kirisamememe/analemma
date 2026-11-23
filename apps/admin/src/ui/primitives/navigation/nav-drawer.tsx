import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { useTranslation } from "react-i18next";

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
      "nav-drawer-panel-animation rounded-e-surface bg-surface-sunken text-fg shadow-overlay outline outline-fg/10",
    ],
  },
});

const { overlay, panel } = drawer();

/** ナビの drawer に渡す値。 */
export type NavDrawerProps = {
  /** Dialog の名前。 */
  label: string;
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
  heading,
  isOpen,
  isPending = false,
  onOpenChange,
  children,
}: NavDrawerProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <AriaButton aria-label={t("ui.openNav")} className={iconButton()}>
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
                aria-label={t("ui.closeNav")}
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
};
