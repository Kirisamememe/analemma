import { type ReactNode, useId } from "react";

import type { LeaveConfirmation } from "@/api/use-leave-confirmation";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

/** 未送信の写真や入力がある画面を離れる前に確かめる。 */
export const UploadLeaveDialog = ({
  leaving,
}: Record<"leaving", LeaveConfirmation>): ReactNode => {
  const t = useTranslate();
  const descriptionId = useId();

  return (
    <Dialog
      descriptionId={descriptionId}
      isOpen={leaving._tag === "Asking"}
      onOpenChange={(open) => {
        if (!open) leaving.stay();
      }}
      title={t("imageUpload.leaveTitle")}
    >
      <Text>
        <span id={descriptionId}>{t("imageUpload.leaveDescription")}</span>
      </Text>
      <Cluster gap={2} justify="end">
        <Button onPress={leaving.stay}>{t("imageUpload.stay")}</Button>
        <Button onPress={leaving.leave}>{t("imageUpload.leave")}</Button>
      </Cluster>
    </Dialog>
  );
};
