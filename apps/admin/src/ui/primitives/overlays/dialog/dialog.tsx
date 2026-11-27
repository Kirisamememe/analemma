import type { ReactNode } from "react";
import { Dialog as AriaDialog, Heading } from "react-aria-components";

import { OverlayFrame } from "../overlay-frame";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const dialog = tv({
  slots: {
    body: "flex flex-col gap-4 outline-hidden",
    title: ["wrap-anywhere text-fg", typography({ role: "section" })],
  },
});

const { body, title: titleStyle } = dialog();

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
  /** 送信中か。 */
  isPending?: boolean;
  /** backdrop の押下で閉じるか。 */
  isDismissable?: boolean | undefined;
  /** Dialog の中身。 */
  children: ReactNode;
};

/** 確認や短い入力のために、今の画面の上に重ねて開く Dialog。 */
export const Dialog = ({
  isOpen,
  onOpenChange,
  title,
  descriptionId = "",
  isPending = false,
  isDismissable = true,
  children,
}: DialogProps): ReactNode => (
  <OverlayFrame
    isDismissable={isDismissable}
    isLocked={isPending}
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    size="dialog"
  >
    <AriaDialog
      aria-describedby={descriptionId}
      className={body()}
      inert={!isOpen}
    >
      <Heading className={titleStyle()} slot="title">
        {title}
      </Heading>
      {children}
    </AriaDialog>
  </OverlayFrame>
);
