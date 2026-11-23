import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { deletePasskey } from "@/features/passkeys/queries/delete-passkey";
import type { PasskeySummary } from "@/features/passkeys/passkey-list";
import { PASSKEYS_QUERY_KEY } from "@/features/passkeys/queries/passkeys-query";
import { toDeleteFailure } from "@/features/passkeys/logic/to-passkey-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

/** パスキーを削除する Dialog に渡す値。 */
type DeletePasskeyDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 削除するパスキー。 */
  passkey: PasskeySummary;
  /** 閉じる関数。 */
  onClose: () => void;
};

/** 再認証をしてから、パスキーを削除する Dialog。 */
export const DeletePasskeyDialog = ({
  isOpen,
  passkey,
  onClose,
}: DeletePasskeyDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();

  const close = (): void => {
    failure.close();
    onClose();
  };

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
      } else {
        failure.show(t(toDeleteFailure(_tag)));
      }
    },
    onError: () => {
      failure.show(t(toDeleteFailure("Unexpected")));
    },
  });

  return (
    <Dialog
      isOpen={isOpen}
      isPending={deleting.isPending}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      title={t("passkeys.deleteTitle", { name: passkey.name })}
    >
      <Text>{t("passkeys.deleteDescription")}</Text>
      <Cluster gap={2} justify="end">
        <Button isDisabled={deleting.isPending} onPress={close}>
          {t("passkeys.cancel")}
        </Button>
        <Button
          isPending={deleting.isPending}
          onPress={() => {
            failure.close();
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
