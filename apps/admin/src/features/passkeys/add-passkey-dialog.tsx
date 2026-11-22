import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Cluster } from "../../ui/layout/cluster";
import { Text } from "../../ui/layout/text";
import { Button } from "../../ui/primitives/button";
import { Form } from "../../ui/primitives/form";
import { TextField } from "../../ui/primitives/form-fields/text-field";
import { Notice } from "../../ui/primitives/notice";
import { Dialog } from "../../ui/primitives/overlays/dialog";
import { useShowToast } from "../../ui/primitives/overlays/toast-context";
import { checkPasskeyName } from "../auth/check-passkey-name";
import { addPasskey } from "./add-passkey";
import { refreshPasskeys } from "./passkeys-query";
import { toAddNotice } from "./to-passkey-notice";

/** パスキーを追加する Dialog に渡す値。 */
type AddPasskeyDialogProps = {
  /** 開いているか。 */
  readonly isOpen: boolean;
  /** 閉じる関数。 */
  readonly onClose: () => void;
};

/** 再認証をしてから、新しいパスキーを追加する Dialog。 */
export const AddPasskeyDialog = ({
  isOpen,
  onClose,
}: AddPasskeyDialogProps): ReactNode => {
  const { t } = useTranslation();
  const showToast = useShowToast();
  const queryClient = useQueryClient();
  const { api, authenticator } = useRouteContext({ from: "__root__" });
  const adding = useMutation({
    mutationFn: async (name: string) =>
      addPasskey({ api, authenticator }, name),
    onSuccess: async ({ _tag }) => {
      if (_tag === "Cancelled") {
        return;
      }

      await refreshPasskeys(queryClient);

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
        <TextField
          autoComplete="off"
          description={t("enroll.nameDescription")}
          isRequired
          label={t("enroll.name")}
          name="name"
          validate={(value) => {
            const problem = checkPasskeyName(value);

            return problem === undefined ? undefined : t(problem);
          }}
        />
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
