import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { checkPasskeyName } from "@/components/check-passkey-name";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import type { PasskeySummary } from "@/features/passkeys/passkey-list";
import { PASSKEYS_QUERY_KEY } from "@/features/passkeys/queries/passkeys-query";
import { renamePasskey } from "@/features/passkeys/queries/rename-passkey";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

/** パスキーの名前を変更する Dialog に渡す値。 */
type RenamePasskeyDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 名前を変更するパスキー。 */
  passkey: PasskeySummary;
  /** 閉じる関数。 */
  onClose: () => void;
};

/** パスキーの名前を変更する Dialog。 */
export const RenamePasskeyDialog = ({
  isOpen,
  passkey,
  onClose,
}: RenamePasskeyDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const close = (): void => {
    failure.close();
    onClose();
  };

  const { refresh } = useApiCache();
  const { api } = useAppContext();

  const renaming = useApiMutation({
    send: (name: string) => renamePasskey(api, { id: passkey.id, name }),
    onSuccess: async ({ _tag }) => {
      await refresh(PASSKEYS_QUERY_KEY);

      if (_tag === "Renamed") {
        onClose();
        showToast({ tone: "success", message: t("passkeys.renamed") });
      } else {
        failure.show(t("passkeys.notFound"));
      }
    },
    onError: () => {
      failure.show(t("passkeys.failed"));
    },
  });
  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: { name: passkey.name },
    onSubmit: ({ value }) => {
      failure.close();
      renaming.mutate(value.name);
    },
  });

  return (
    <Dialog
      isOpen={isOpen}
      isPending={renaming.isPending}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      title={t("passkeys.renameTitle")}
    >
      <form.AppForm>
        <form.Form isPending={renaming.isPending}>
          <form.AppField
            name="name"
            validators={{
              onChange: checkAfterSubmit((value: string) => {
                const problem = checkPasskeyName(value);

                return problem === undefined ? undefined : t(problem);
              }),
            }}
          >
            {(field) => (
              <field.TextField
                autoComplete="off"
                isRequired
                label={t("enroll.name")}
              />
            )}
          </form.AppField>
          <Cluster gap={2} justify="end">
            <Button isDisabled={renaming.isPending} onPress={close}>
              {t("passkeys.cancel")}
            </Button>
            <Button isPending={renaming.isPending} tone="primary" type="submit">
              {t("passkeys.save")}
            </Button>
          </Cluster>
        </form.Form>
      </form.AppForm>
    </Dialog>
  );
};
