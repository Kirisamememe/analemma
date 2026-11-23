import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { checkPasskeyName } from "@/components/logic/check-passkey-name";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { addPasskey } from "@/features/passkeys/queries/add-passkey";
import { PASSKEYS_QUERY_KEY } from "@/features/passkeys/queries/passkeys-query";
import { toAddFailure } from "@/features/passkeys/logic/to-passkey-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

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
  const failure = useFailureToast();

  const close = (): void => {
    failure.close();
    onClose();
  };

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
      } else {
        failure.show(t(toAddFailure(_tag)));
      }
    },
    onError: () => {
      failure.show(t(toAddFailure("Unexpected")));
    },
  });

  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: { name: "" },
    onSubmit: ({ value }) => {
      failure.close();
      adding.mutate(value.name);
    },
  });

  return (
    <Dialog
      isOpen={isOpen}
      isPending={adding.isPending}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      title={t("passkeys.add")}
    >
      <Text tone="muted">{t("passkeys.addDescription")}</Text>
      <form.AppForm>
        <form.Form isPending={adding.isPending}>
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
                description={t("enroll.nameDescription")}
                isRequired
                label={t("enroll.name")}
              />
            )}
          </form.AppField>
          <Cluster gap={2} justify="end">
            <Button isDisabled={adding.isPending} onPress={close}>
              {t("passkeys.cancel")}
            </Button>
            <Button isPending={adding.isPending} tone="primary" type="submit">
              {t("passkeys.add")}
            </Button>
          </Cluster>
        </form.Form>
      </form.AppForm>
    </Dialog>
  );
};
