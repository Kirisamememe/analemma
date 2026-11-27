import type { ReactNode } from "react";
import { Dialog as AriaDialog, Heading } from "react-aria-components";

import { OverlayFrame } from "../overlay-frame";
import { useModalScrollInsets } from "./hooks/use-modal-scroll-insets";
import { ModalFooter, type ModalFooterSlots } from "./modal-footer";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const modal = tv({
  slots: {
    scroller: [
      "flex min-h-0 min-w-0 flex-col outline-hidden",
      "modal-scroller overflow-y-auto overscroll-y-contain",
    ],
    header: [
      "flex shrink-0 items-center justify-between gap-4",
      "sticky -top-3 z-sticky modal-bar-backdrop px-panel pt-6 pb-3 short-viewport:static",
    ],
    title: [
      "wrap-anywhere text-fg",
      typography({ role: "page" }),
      "modal-title-animation",
    ],
    content: "flex shrink-0 flex-col gap-4 py-4",
  },
});

const { scroller, header, title: titleStyle, content } = modal();

/** `Modal` に渡す値。 */
type ModalProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 開け閉めを知らせる関数。 */
  onOpenChange: (isOpen: boolean) => void;
  /** モーダルの名前。 */
  title: string;
  /** 送信中か。 */
  isPending?: boolean;
  /** 本文の最大幅(フォームか、写真などの一覧か)。 */
  width?: "form" | "page";
  /** 本文。 */
  children: ReactNode;
  /** 本文をスクロールしている間も下端に表示する内容。 */
  footer?: ModalFooterSlots;
};

/** 見出しと下端の帯の間で本文をスクロールする、ひとまとまりの作業のためのモーダル。 */
export const Modal = ({
  isOpen,
  onOpenChange,
  title,
  isPending = false,
  width = "form",
  children,
  footer,
}: ModalProps): ReactNode => {
  const t = useTranslate();
  const { attachHeader, attachFooter } = useModalScrollInsets();

  return (
    <OverlayFrame
      isLocked={isPending}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={width}
    >
      <AriaDialog className={scroller()} inert={!isOpen}>
        <div className={header()} ref={attachHeader}>
          <Heading className={titleStyle()} slot="title">
            {title}
          </Heading>
          <div className="shrink-0">
            <Button
              aria-label={t("ui.close")}
              icon="x"
              iconWeight="bold"
              isDisabled={isPending}
              onPress={() => {
                onOpenChange(false);
              }}
              rounded="full"
              size="sm"
              tone="quiet"
            />
          </div>
        </div>
        <div className={content()}>{children}</div>
        <ModalFooter
          end={footer?.end}
          ref={attachFooter}
          start={footer?.start}
        />
      </AriaDialog>
    </OverlayFrame>
  );
};
