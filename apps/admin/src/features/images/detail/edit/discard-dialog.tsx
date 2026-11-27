import { type ReactNode, useId } from "react";

import type { ImageEditor } from "./hooks/use-edit-image";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

/** 閉じる前と離れる前の確かめに渡す値。 */
type DiscardDialogProps = Pick<
  ImageEditor,
  "confirmation" | "stay" | "discard"
>;

/** 保存していない変更を残して閉じる前と、保存の途中で離れる前に確かめる Dialog。 */
export const DiscardDialog = ({
  confirmation: { isOpen, whileSaving },
  stay,
  discard,
}: DiscardDialogProps): ReactNode => {
  const t = useTranslate();
  const descriptionId = useId();

  const prompt = whileSaving
    ? {
        title: t("imageDetail.leavingWhileSaving"),
        description: t("imageDetail.savingWillContinue"),
        stay: t("imageDetail.waitForSave"),
        leave: t("imageDetail.leaveDuringSave"),
      }
    : {
        title: t("imageDetail.discardTitle"),
        description: t("imageDetail.discardDescription"),
        stay: t("imageDetail.continueEditing"),
        leave: t("imageDetail.discard"),
      };

  return (
    <Dialog
      isOpen={isOpen}
      descriptionId={descriptionId}
      title={prompt.title}
      onOpenChange={(open) => {
        if (!open) stay();
      }}
    >
      <Text>
        <span id={descriptionId}>{prompt.description}</span>
      </Text>
      <Cluster gap={2} justify="end">
        <Button onPress={stay}>{prompt.stay}</Button>
        <Button tone={whileSaving ? "secondary" : "danger"} onPress={discard}>
          {prompt.leave}
        </Button>
      </Cluster>
    </Dialog>
  );
};
