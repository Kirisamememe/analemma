import { type ReactNode, useCallback } from "react";
import { Dialog as AriaDialog, Heading } from "react-aria-components";

import { OverlayFrame } from "../overlay-frame";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const statusDialog = tv({
  slots: {
    body: "flex flex-col items-center gap-3 px-4 py-6 text-center outline-hidden",
    title: ["wrap-anywhere text-fg", typography({ role: "section" })],
    emblem: "grid size-12 place-items-center rounded-full",
    indicator: "*:stroke-2",
    close: "absolute inset-e-2 top-2",
  },
  variants: {
    status: {
      pending: {
        emblem: "bg-surface-muted text-fg-muted",
        indicator: "motion-safe:animate-spin motion-reduce:animate-pulse",
      },
      success: { emblem: "bg-success/10 text-success" },
    },
  },
});

/** `StatusDialog` に渡す値。 */
type StatusDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 開け閉めを知らせる関数。 */
  onOpenChange: (isOpen: boolean) => void;
  /** 処理の状態を伝える文言。 */
  title: string;
  /** 処理中か、成功したか。 */
  status: "pending" | "success";
};

/** 処理中から成功に切り替わる、画面の中央の表示。 */
export const StatusDialog = ({
  isOpen,
  onOpenChange,
  title,
  status,
}: StatusDialogProps): ReactNode => {
  const t = useTranslate();
  const style = statusDialog({ status });

  const panel = useCallback(
    (element: HTMLElement | null) => {
      if (!isOpen || element === null) return;

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

  return (
    <OverlayFrame
      isFocusHeld={status === "pending"}
      isLocked={status === "pending"}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="status"
    >
      <AriaDialog className={style.body()} inert={!isOpen} ref={panel}>
        <span className={style.emblem()}>
          <span className={style.indicator()}>
            <Icon
              name={status === "pending" ? "loader-circle" : "check"}
              size="xl"
              weight="bold"
            />
          </span>
        </span>
        <Heading className={style.title()} slot="title">
          <span aria-live="polite">{title}</span>
        </Heading>
        {status === "success" && (
          <div className={style.close()}>
            <Button
              aria-label={t("ui.close")}
              icon="x"
              onPress={() => {
                onOpenChange(false);
              }}
              rounded="full"
              size="sm"
              tone="quiet"
            />
          </div>
        )}
      </AriaDialog>
    </OverlayFrame>
  );
};
