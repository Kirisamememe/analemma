import { type ReactNode, type Ref, useCallback } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { DialogFooter, type DialogFooterSlots } from "../dialog-footer";
import { useDialogScrollInsets } from "../hooks/use-dialog-scroll-insets";
import { overlayPanel } from "../overlay-panel-style";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
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
      "dialog-panel-animation",
      overlayPanel(),
    ],
    body: "flex flex-col gap-4 outline-hidden",
    header: "contents",
    content: "",
    title: ["wrap-anywhere text-fg", typography({ role: "section" })],
    emblem: "grid size-12 place-items-center rounded-full",
    indicator: "*:stroke-2",
    close: "absolute inset-e-2 top-2",
  },
  variants: {
    framed: {
      true: {
        modal: "flex flex-col overflow-hidden p-0",
        body: "min-h-0 min-w-0 dialog-scroller gap-0 overflow-y-auto overscroll-y-contain",
        header: [
          "flex shrink-0 items-center justify-between gap-4",
          "sticky top-0 z-sticky dialog-bar-backdrop px-panel pt-6 pb-3 short-viewport:static",
        ],
        content: "flex shrink-0 flex-col gap-4 py-4",
      },
    },
    layout: {
      wide: {
        modal: "relative max-w-form",
        header: "-top-3",
        title: [typography({ role: "page" }), "dialog-title-animation"],
        close: "static shrink-0",
      },
    },
    width: {
      page: { modal: "@container max-w-page" },
    },
    status: {
      pending: {
        modal: "relative w-80 max-w-full p-2",
        body: "items-center gap-3 px-4 py-6 text-center",
        emblem: "bg-surface-muted text-fg-muted",
        indicator: "motion-safe:animate-spin motion-reduce:animate-pulse",
      },
      success: {
        modal: "relative w-80 max-w-full p-2",
        body: "items-center gap-3 px-4 py-6 text-center",
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
  /** 本文をスクロールしている間も下端に表示する内容。 */
  footer?: DialogFooterSlots;
  /** 見出しの隣に閉じる操作を置き、広い本文をパネルの縁まで使う配置。 */
  layout?: "wide" | undefined;
  /** 写真などを一覧する本文の最大幅。 */
  width?: "page" | undefined;
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
  footer,
  status,
  layout,
  width,
}: DialogProps): ReactNode => {
  const t = useTranslate();
  const framed = layout === "wide" || footer !== undefined;
  const { attachHeader, attachFooter } = useDialogScrollInsets();

  const {
    overlay,
    modal,
    body,
    header,
    content,
    title: titleSlot,
    emblem,
    indicator,
    close,
  } = dialog({ status, layout, framed, width });

  const panel = useCallback(
    (element: HTMLElement | null) => {
      if (!isOpen || status === undefined || element === null) return;

      if (status === "success") {
        element.querySelector("button")?.focus({ preventScroll: true });
        return;
      }

      element.focus({ preventScroll: true });

      const keepTab = (event: KeyboardEvent): void => {
        if (event.key === "Tab") event.preventDefault();
      };

      element.addEventListener("keydown", keepTab);

      return () => {
        element.removeEventListener("keydown", keepTab);
      };
    },
    [isOpen, status],
  );

  const locked = isPending || status === "pending";

  return (
    <ModalOverlay
      className={overlay()}
      onPointerDownCapture={(event) => {
        if (status === "pending" && event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
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
          ref={panel}
        >
          {status !== undefined && (
            <span className={emblem()}>
              <span className={indicator()}>
                <Icon
                  name={status === "pending" ? "loader-circle" : "check"}
                  size="xl"
                  weight="bold"
                />
              </span>
            </span>
          )}
          <div className={header()} ref={framed ? attachHeader : undefined}>
            <Heading className={titleSlot()} slot="title">
              <span aria-live={status === undefined ? undefined : "polite"}>
                {title}
              </span>
            </Heading>
            {(status === "success" || layout === "wide") && (
              <div className={close()}>
                <Button
                  aria-label={t("ui.close")}
                  isDisabled={locked}
                  icon="x"
                  iconWeight={layout === "wide" ? "bold" : "regular"}
                  onPress={() => {
                    onOpenChange(false);
                  }}
                  rounded="full"
                  size="sm"
                  tone="quiet"
                />
              </div>
            )}
          </div>
          {framed ? <div className={content()}>{children}</div> : children}
          {footer && (
            <DialogFooter
              start={footer.start}
              end={footer.end}
              ref={attachFooter}
            />
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
};

type DialogSectionProps = {
  /** 欄の中身。 */
  children: ReactNode;
  /** 描画した本文の欄を参照する。 */
  ref?: Ref<HTMLDivElement>;
};

/** Dialog の見出しと左右をそろえる欄。 */
export const DialogSection = ({
  children,
  ref,
}: DialogSectionProps): ReactNode => (
  <div ref={ref} className="px-panel">
    {children}
  </div>
);
