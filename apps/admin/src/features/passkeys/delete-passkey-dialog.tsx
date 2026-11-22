import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Cluster } from "../../ui/layout/cluster";
import { Text } from "../../ui/layout/text";
import { Button } from "../../ui/primitives/button";
import { Dialog } from "../../ui/primitives/dialog";
import { Notice } from "../../ui/primitives/notice";
import { deletePasskey } from "./delete-passkey";
import type { PasskeySummary } from "./passkey-list";
import { refreshPasskeys } from "./passkeys-query";
import { type PasskeyNotice, toDeleteNotice } from "./to-passkey-notice";

/** パスキーを削除する Dialog に渡す値。 */
type DeletePasskeyDialogProps = {
  /** 開いているか。 */
  readonly isOpen: boolean;
  /** 削除するパスキー。 */
  readonly passkey: PasskeySummary;
  /** 閉じる関数。 */
  readonly onClose: () => void;
  /** 消せたことを知らせる関数。 */
  readonly onDeleted: (notice: PasskeyNotice) => void;
};

/** 再認証をしてから、パスキーを削除する Dialog。 */
export const DeletePasskeyDialog = ({
  isOpen,
  passkey,
  onClose,
  onDeleted,
}: DeletePasskeyDialogProps): ReactNode => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { api, authenticator } = useRouteContext({ from: "__root__" });
  const deleting = useMutation({
    mutationFn: async () => deletePasskey({ api, authenticator }, passkey.id),
    onSuccess: async ({ _tag }) => {
      if (_tag === "Cancelled") {
        return;
      }

      await refreshPasskeys(queryClient);

      if (_tag === "Deleted") {
        onDeleted({ tone: "success", message: "passkeys.deleted" });
        onClose();
      }
    },
  });
  const outcome = deleting.isError ? "Unexpected" : deleting.data?._tag;
  const notice =
    outcome === undefined || outcome === "Deleted"
      ? undefined
      : toDeleteNotice(outcome);

  return (
    <Dialog
      isOpen={isOpen}
      isPending={deleting.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t("passkeys.deleteTitle", { name: passkey.name })}
    >
      <Text>{t("passkeys.deleteDescription")}</Text>
      {notice !== undefined && (
        <Notice tone={notice.tone}>{t(notice.message)}</Notice>
      )}
      <Cluster gap={2} justify="end">
        <Button isDisabled={deleting.isPending} onPress={onClose}>
          {t("passkeys.cancel")}
        </Button>
        <Button
          isPending={deleting.isPending}
          onPress={() => {
            deleting.mutate();
          }}
          tone="danger"
        >
          {t("passkeys.delete")}
        </Button>
      </Cluster>
    </Dialog>
  );
};
