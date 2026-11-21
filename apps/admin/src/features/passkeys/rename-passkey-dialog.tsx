import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useTranslation } from "../../i18n/use-translation";
import { Cluster } from "../../ui/layout/cluster";
import { Button } from "../../ui/primitives/button";
import { Dialog } from "../../ui/primitives/dialog";
import { Form } from "../../ui/primitives/form";
import { Notice } from "../../ui/primitives/notice";
import { TextField } from "../../ui/primitives/text-field";
import { checkPasskeyName } from "../auth/check-passkey-name";
import type { PasskeySummary } from "./passkey-list";
import { refreshPasskeys } from "./passkeys-query";
import { renamePasskey } from "./rename-passkey";
import type { PasskeyNotice } from "./to-passkey-notice";

/** パスキーの名前を変える画面に渡す値。 */
type RenamePasskeyDialogProps = {
  /** 名前を変えるパスキー。 */
  readonly passkey: PasskeySummary;
  /** 閉じる関数。 */
  readonly onClose: () => void;
  /** 名前を変えたことを知らせる関数。 */
  readonly onRenamed: (notice: PasskeyNotice) => void;
};

/** パスキーの名前を変える画面。 */
export const RenamePasskeyDialog = ({
  passkey,
  onClose,
  onRenamed,
}: RenamePasskeyDialogProps): ReactNode => {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const { api } = useRouteContext({ from: "__root__" });
  const renaming = useMutation({
    mutationFn: async (name: string) =>
      renamePasskey(api, { id: passkey.id, name }),
    onSuccess: async ({ _tag }) => {
      await refreshPasskeys(queryClient);

      if (_tag === "Renamed") {
        onRenamed({ tone: "success", message: "passkeys.renamed" });
        onClose();
      }
    },
  });

  return (
    <Dialog
      isOpen
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
