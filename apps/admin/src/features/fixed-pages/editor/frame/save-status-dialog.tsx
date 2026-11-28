import type { ReactNode } from "react";

import type { SaveStatus } from "../hooks/save-status-context";

import { useTranslate } from "@/i18n/use-translate";
import { StatusDialog } from "@/ui/primitives/overlays";

/** 保存の Dialog に渡す値。 */
type SaveStatusDialogProps = {
  /** 保存中か、作成・更新を終えたか。 */
  status: Exclude<SaveStatus, undefined>;
  /** 終えた知らせを閉じたときに呼ぶ関数。 */
  onClose: () => void;
};

const focusFirstField = (): void => {
  const main = document.querySelector("main");
  const field = main?.querySelector("input") ?? main?.querySelector("a");

  field?.focus();
};

/** 固定ページの保存中と、作成・更新を終えたことを出す Dialog。 */
export const SaveStatusDialog = ({
  status,
  onClose,
}: SaveStatusDialogProps): ReactNode => {
  const t = useTranslate();
  const isPending = status === "pending";

  const close = (isOpen: boolean): void => {
    if (isOpen || isPending) return;

    onClose();

    if (status === "created") requestAnimationFrame(focusFirstField);
  };

  return (
    <StatusDialog
      closeLabel={t("ui.close")}
      isOpen
      title={t(
        isPending ? "fixedPageEditor.saving" : `fixedPageEditor.${status}`,
      )}
      status={isPending ? "pending" : "success"}
      onOpenChange={close}
    />
  );
};
