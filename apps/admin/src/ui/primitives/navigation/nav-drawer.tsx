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
  base: "flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden transition is-hovered:state-hover is-focus-shown:focus-ring is-pressed:state-pressed is-disabled:state-disabled",
});

/** ナビの drawer に渡す値。 */
export type NavDrawerProps = {
  /** Dialog の名前。 */
  readonly label: string;
  /** 閉じるボタンと並べて、上の段に描く見出し。 */
  readonly heading: ReactNode;
  /** 開いているか。 */
  readonly isOpen: boolean;
  /** 送信中か。 */
  readonly isPending?: boolean;
  /** 開け閉めを知らせる関数。 */
  readonly onOpenChange: (isOpen: boolean) => void;
  /** drawer の中身。 */
  readonly children: ReactNode;
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
        className="fixed top-0 left-0 z-overlay flex h-(--visual-viewport-height) w-full dialog-backdrop-animation bg-scrim/40"
        isDismissable={isOpen && !isPending}
        isKeyboardDismissDisabled={isPending}
      >
        <Modal className="h-full w-sidebar max-w-full nav-drawer-panel-animation overflow-y-auto rounded-e-surface bg-surface-sunken text-fg shadow-overlay outline outline-fg/10">
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
