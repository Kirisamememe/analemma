import { type ReactNode, useId } from "react";

import type { LeaveConfirmation } from "@/api/use-leave-confirmation";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

type UploadLeaveDialogProps = {
  /** 確かめの状態と、残る・続ける操作。 */
  leaving: LeaveConfirmation;
  /** 「完了」で破棄する、追加できなかった写真の枚数。 */
  discarded?: number | undefined;
};

const LEAVE = {
  title: "imageUpload.leaveTitle",
  stay: "imageUpload.stay",
  leave: "imageUpload.leave",
} as const;

const DISCARD = {
  title: "imageUpload.discardTitle",
  stay: "imageUpload.keep",
  leave: "imageUpload.discard",
} as const;

/** 未送信の写真や入力を残して画面を離れる前と、追加できなかった写真を残して完了する前に確かめる。 */
export const UploadLeaveDialog = ({
  leaving,
  discarded,
}: UploadLeaveDialogProps): ReactNode => {
  const t = useTranslate();
  const descriptionId = useId();
  const keys = discarded === undefined ? LEAVE : DISCARD;

  return (
    <Dialog
      descriptionId={descriptionId}
      isOpen={leaving._tag === "Asking"}
      onOpenChange={(open) => {
        if (!open) leaving.stay();
      }}
      title={t(keys.title)}
    >
      <Text>
        <span id={descriptionId}>
          {discarded === undefined
            ? t("imageUpload.leaveDescription")
            : t("imageUpload.discardDescription", { count: discarded })}
        </span>
      </Text>
      <Cluster gap={2} justify="end">
        <Button onPress={leaving.stay}>{t(keys.stay)}</Button>
        <Button tone="danger" onPress={leaving.leave}>
          {t(keys.leave)}
        </Button>
      </Cluster>
    </Dialog>
  );
};
