import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const dialog = tv({
  slots: {
    overlay: [
      "fixed top-0 left-0 z-overlay h-(--visual-viewport-height) w-full p-4",
      "flex items-center justify-center",
      "dialog-backdrop-animation bg-scrim/40",
    ],
    modal: [
      "max-h-full w-full max-w-md overflow-y-auto rounded-surface p-6",
      "dialog-panel-animation bg-surface text-fg shadow-overlay outline outline-fg/10",
    ],
    body: "flex flex-col gap-4 outline-hidden",
    title: "wrap-anywhere text-fg",
  },
});

const { overlay, modal, body, title: titleSlot } = dialog();

/** `Dialog` に渡す値。 */
type DialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 開け閉めを知らせる関数。 */
  onOpenChange: (isOpen: boolean) => void;
  /** Dialog の名前。 */
  title: string;
  /** 説明の要素の ID。 */
  descriptionId?: string;
  /** 送信中か(送信中は Escape と backdrop の押下で閉じない)。 */
  isPending?: boolean;
  /** backdrop の押下で閉じるか(閉じないときも、Escape では閉じる)。 */
  isDismissable?: boolean | undefined;
  /** Dialog の中身。 */
  children: ReactNode;
};

/** 今の画面の上に重ねて開き、focus を閉じ込める Dialog。 */
export const Dialog = ({
  isOpen,
  onOpenChange,
  title,
  descriptionId = "",
  isPending = false,
  isDismissable = true,
  children,
}: DialogProps): ReactNode => (
  <ModalOverlay
    className={overlay()}
    isDismissable={isOpen && !isPending && isDismissable}
    isKeyboardDismissDisabled={isPending}
    isOpen={isOpen}
    onOpenChange={onOpenChange}
  >
    <Modal className={modal()}>
      <AriaDialog
        aria-describedby={descriptionId}
        className={body()}
        inert={!isOpen}
      >
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
