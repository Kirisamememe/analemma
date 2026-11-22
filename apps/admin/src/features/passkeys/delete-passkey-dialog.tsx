import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { deletePasskey } from "@/features/passkeys/delete-passkey";
import type { PasskeySummary } from "@/features/passkeys/passkey-list";
import { PASSKEYS_QUERY_KEY } from "@/features/passkeys/passkeys-query";
import { toDeleteNotice } from "@/features/passkeys/to-passkey-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";
import { Dialog, useShowToast } from "@/ui/primitives/overlays";

/** パスキーを削除する Dialog に渡す値。 */
type DeletePasskeyDialogProps = {
  /** 開いているか。 */
  readonly isOpen: boolean;
  /** 削除するパスキー。 */
  readonly passkey: PasskeySummary;
  /** 閉じる関数。 */
  readonly onClose: () => void;
};

/** 再認証をしてから、パスキーを削除する Dialog。 */
export const DeletePasskeyDialog = ({
  isOpen,
  passkey,
  onClose,
}: DeletePasskeyDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api, authenticator } = useAppContext();
  const deleting = useApiMutation({
    send: () => deletePasskey({ api, authenticator }, passkey.id),
    onSuccess: async ({ _tag }) => {
      if (_tag === "Cancelled") {
        return;
      }

      await refresh(PASSKEYS_QUERY_KEY);

      if (_tag === "Deleted") {
        onClose();
        showToast({ tone: "success", message: t("passkeys.deleted") });
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
