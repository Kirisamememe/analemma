import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { PasskeyNameField } from "@/components/passkey-name-field";
import { toAddNotice } from "@/features/passkeys/logic/to-passkey-notice";
import { addPasskey } from "@/features/passkeys/queries/add-passkey";
import { PASSKEYS_QUERY_KEY } from "@/features/passkeys/queries/passkeys-query";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { Notice } from "@/ui/primitives/notice";
import { Dialog, useShowToast } from "@/ui/primitives/overlays";

/** パスキーを追加する Dialog に渡す値。 */
type AddPasskeyDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 閉じる関数。 */
  onClose: () => void;
};

/** 再認証をしてから、新しいパスキーを追加する Dialog。 */
export const AddPasskeyDialog = ({
  isOpen,
  onClose,
}: AddPasskeyDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api, authenticator } = useAppContext();

  const adding = useApiMutation({
    send: (name: string) => addPasskey({ api, authenticator }, name),
    onSuccess: async ({ _tag }) => {
      if (_tag === "Cancelled") {
        return;
      }

      await refresh(PASSKEYS_QUERY_KEY);

      if (_tag === "Added") {
        onClose();
        showToast({ tone: "success", message: t("passkeys.added") });
      }
    },
  });

  const outcome = adding.isError ? "Unexpected" : adding.data?._tag;

  const notice =
    outcome === undefined || outcome === "Added"
      ? undefined
      : toAddNotice(outcome);

  return (
    <Dialog
      isOpen={isOpen}
      isPending={adding.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t("passkeys.add")}
    >
      <Text tone="muted">{t("passkeys.addDescription")}</Text>
      <Form
        isPending={adding.isPending}
        onSubmit={(data) => {
          const name = data.get("name");

          adding.mutate(typeof name === "string" ? name : "");
        }}
      >
        <PasskeyNameField showDescription />
        {notice !== undefined && (
          <Notice tone={notice.tone}>{t(notice.message)}</Notice>
        )}
        <Cluster gap={2} justify="end">
          <Button isDisabled={adding.isPending} onPress={onClose}>
            {t("passkeys.cancel")}
          </Button>
          <Button isPending={adding.isPending} tone="primary" type="submit">
            {t("passkeys.add")}
          </Button>
        </Cluster>
      </Form>
    </Dialog>
  );
};
