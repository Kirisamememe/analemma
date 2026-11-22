import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { checkPasskeyName } from "@/features/auth/check-passkey-name";
import type { PasskeySummary } from "@/features/passkeys/passkey-list";
import { PASSKEYS_QUERY_KEY } from "@/features/passkeys/passkeys-query";
import { renamePasskey } from "@/features/passkeys/rename-passkey";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout/cluster";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { TextField } from "@/ui/primitives/form-fields/text-field";
import { Notice } from "@/ui/primitives/notice";
import { Dialog } from "@/ui/primitives/overlays/dialog";
import { useShowToast } from "@/ui/primitives/overlays/toast-context";

/** パスキーの名前を変更する Dialog に渡す値。 */
type RenamePasskeyDialogProps = {
  /** 開いているか。 */
  readonly isOpen: boolean;
  /** 名前を変更するパスキー。 */
  readonly passkey: PasskeySummary;
  /** 閉じる関数。 */
  readonly onClose: () => void;
};

/** パスキーの名前を変更する Dialog。 */
export const RenamePasskeyDialog = ({
  isOpen,
  passkey,
  onClose,
}: RenamePasskeyDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const renaming = useApiMutation({
    send: (name: string) => renamePasskey(api, { id: passkey.id, name }),
    onSuccess: async ({ _tag }) => {
      await refresh(PASSKEYS_QUERY_KEY);

      if (_tag === "Renamed") {
        onClose();
        showToast({ tone: "success", message: t("passkeys.renamed") });
      }
    },
  });

  return (
    <Dialog
      isOpen={isOpen}
      isPending={renaming.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t("passkeys.renameTitle")}
    >
      <Form
        isPending={renaming.isPending}
        onSubmit={(data) => {
          const name = data.get("name");

          renaming.mutate(typeof name === "string" ? name : "");
        }}
      >
        <TextField
          autoComplete="off"
          defaultValue={passkey.name}
          isRequired
          label={t("enroll.name")}
          name="name"
          validate={(value) => {
            const problem = checkPasskeyName(value);

            return problem === undefined ? undefined : t(problem);
          }}
        />
        {renaming.data?._tag === "NotFound" && (
          <Notice tone="warning">{t("passkeys.notFound")}</Notice>
        )}
        {renaming.isError && (
          <Notice tone="danger">{t("passkeys.failed")}</Notice>
        )}
        <Cluster gap={2} justify="end">
          <Button isDisabled={renaming.isPending} onPress={onClose}>
            {t("passkeys.cancel")}
          </Button>
          <Button isPending={renaming.isPending} tone="primary" type="submit">
            {t("passkeys.save")}
          </Button>
        </Cluster>
      </Form>
    </Dialog>
  );
};
