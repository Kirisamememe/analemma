import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { tv } from "../tv";
import { typography } from "../typography";

const dialog = tv({
  slots: {
    overlay:
      "fixed inset-0 z-overlay flex items-center justify-center bg-scrim/40 p-4",
    modal:
      "w-full max-w-md rounded-surface border border-line bg-surface p-6 text-fg shadow-overlay",
    body: "flex flex-col gap-4 outline-hidden",
    title: "text-fg",
  },
});

const { overlay, modal, body, title: titleSlot } = dialog();

/** 浮かぶ確認の画面に渡す値。 */
type DialogProps = {
  /** 開いているか。 */
  readonly isOpen: boolean;
  /** 開け閉めを知らせる関数。 */
  readonly onOpenChange: (isOpen: boolean) => void;
  /** 画面の名前。 */
  readonly title: string;
  /** 送信中か(送信中は Escape と外側の押下で閉じない)。 */
  readonly isPending?: boolean;
  /** 画面の中身。 */
  readonly children: ReactNode;
};

/** 今の画面の上に浮かべ、focus を閉じ込める確認の画面。 */
export const Dialog = ({
  isOpen,
  onOpenChange,
  title,
  isPending = false,
  children,
}: DialogProps): ReactNode => (
  <ModalOverlay
    className={overlay()}
    isDismissable={!isPending}
    isKeyboardDismissDisabled={isPending}
    isOpen={isOpen}
    onOpenChange={onOpenChange}
  >
    <Modal className={modal()}>
      <AriaDialog className={body()}>
        <Heading
          className={titleSlot({ className: typography({ role: "section" }) })}
          slot="title"
        >
          {title}
        </Heading>
        {children}
      </AriaDialog>
    </Modal>
  </ModalOverlay>
);
