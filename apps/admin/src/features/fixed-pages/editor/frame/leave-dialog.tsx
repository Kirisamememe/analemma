import type { ReactNode } from "react";

import type { LeaveConfirmation } from "@/api/use-leave-confirmation";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

/** 離れる前の確かめに渡す値。 */
type LeaveDialogProps = {
  /** 確かめの状態。 */
  leaving: LeaveConfirmation;
};

/** 保存していない入力を残して離れる前に確かめる Dialog。 */
export const LeaveDialog = ({ leaving }: LeaveDialogProps): ReactNode => {
  const t = useTranslate();

  const stay = (): void => {
    if (leaving._tag === "Asking") leaving.stay();
  };

  return (
    <Dialog
      isOpen={leaving._tag === "Asking"}
      onOpenChange={(open) => {
        if (!open) stay();
      }}
      title={t("fixedPageEditor.leaveTitle")}
    >
      <Text>{t("fixedPageEditor.leaveDescription")}</Text>
      <Cluster gap={2} justify="end">
        <Button onPress={stay}>{t("fixedPageEditor.stay")}</Button>
        <Button
          onPress={() => {
            if (leaving._tag === "Asking") leaving.leave();
          }}
          tone="danger"
        >
          {t("fixedPageEditor.leave")}
        </Button>
      </Cluster>
    </Dialog>
  );
};
