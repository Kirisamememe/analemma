import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Cluster } from "../../ui/layout/cluster";
import { Button } from "../../ui/primitives/button";
import { Form } from "../../ui/primitives/form";
import { TextField } from "../../ui/primitives/form-fields/text-field";
import { Notice } from "../../ui/primitives/notice";
import { Dialog } from "../../ui/primitives/overlays/dialog";
import { useShowToast } from "../../ui/primitives/overlays/toast-context";
import { checkPasskeyName } from "../auth/check-passkey-name";
import type { PasskeySummary } from "./passkey-list";
import { refreshPasskeys } from "./passkeys-query";
import { renamePasskey } from "./rename-passkey";

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
  const { t } = useTranslation();
  const showToast = useShowToast();
  const queryClient = useQueryClient();
  const { api } = useRouteContext({ from: "__root__" });
  const renaming = useMutation({
    mutationFn: async (name: string) =>
      renamePasskey(api, { id: passkey.id, name }),
    onSuccess: async ({ _tag }) => {
      await refreshPasskeys(queryClient);

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
