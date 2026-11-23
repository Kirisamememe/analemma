import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { Icon, Spinner } from "@/ui/primitives/graphics";
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
    emblem: "grid size-12 place-items-center rounded-full",
    close: "absolute inset-e-2 top-2",
  },
  variants: {
    status: {
      pending: {
        modal: "w-80 max-w-full p-2",
        body: "relative items-center gap-3 px-4 py-6 text-center",
        emblem: "bg-surface-muted text-fg-muted",
      },
      success: {
        modal: "w-80 max-w-full p-2",
        body: "relative items-center gap-3 px-4 py-6 text-center",
        emblem: "bg-success/10 text-success",
      },
    },
  },
});

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
  children?: ReactNode;
  /** 処理中から成功に切り替わる中央の表示。 */
  status?: "pending" | "success" | undefined;
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
  status,
}: DialogProps): ReactNode => {
  const t = useTranslate();

  const {
    overlay,
    modal,
    body,
    title: titleSlot,
    emblem,
    close,
  } = dialog({ status });

  const locked = isPending || status === "pending";

  return (
    <ModalOverlay
      className={overlay()}
      isDismissable={isOpen && !locked && isDismissable}
      isKeyboardDismissDisabled={locked}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal className={modal()}>
        <AriaDialog
          aria-describedby={descriptionId}
          className={body()}
          inert={!isOpen}
        >
          {status !== undefined && (
            <span className={emblem()}>
              {status === "pending" ? (
                <Spinner />
              ) : (
                <Icon name="check" size="xl" />
              )}
            </span>
          )}
          <Heading
            className={titleSlot({
              className: typography({ role: "section" }),
            })}
            slot="title"
          >
            <span aria-live={status === undefined ? undefined : "polite"}>
              {title}
            </span>
          </Heading>
          {status === "success" && (
            <div className={close()}>
              <Button
                aria-label={t("ui.close")}
                icon="x"
                onPress={() => {
                  onOpenChange(false);
                }}
                tone="quiet"
              />
            </div>
          )}
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
};
