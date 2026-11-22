import { type ReactNode, useState } from "react";

import { useAppContext, useGoToLogin } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout/cluster";
import { Heading } from "@/ui/layout/heading";
import { Stack } from "@/ui/layout/stack";
import { Text } from "@/ui/layout/text";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";
import { Dialog } from "@/ui/primitives/overlays/dialog";

/** すべてのセッションからログアウトする操作。 */
export const LogOutAllSection = (): ReactNode => {
  const t = useTranslate();
  const goToLogin = useGoToLogin();
  const { clear } = useApiCache();
  const { api } = useAppContext();
  const [isConfirming, setConfirming] = useState(false);
  const logOutAll = useApiMutation({
    send: () => api.admin.session.logOutAll(),
    onSuccess: () => {
      clear();
      goToLogin();
    },
  });

  return (
    <Stack as="section" gap={4}>
      <Heading level={2}>{t("sessions.title")}</Heading>
      <Text tone="muted">{t("sessions.description")}</Text>
      <Cluster>
        <Button
          onPress={() => {
            logOutAll.reset();
            setConfirming(true);
          }}
          tone="danger"
        >
          {t("sessions.logOutAll")}
        </Button>
      </Cluster>
      <Dialog
        isOpen={isConfirming}
        isPending={logOutAll.isPending}
        onOpenChange={setConfirming}
        title={t("sessions.logOutAllTitle")}
      >
        <Text>{t("sessions.description")}</Text>
        {logOutAll.isError && (
          <Notice tone="danger">{t("sessions.logOutAllFailed")}</Notice>
        )}
        <Cluster gap={2} justify="end">
          <Button
            isDisabled={logOutAll.isPending}
            onPress={() => {
              setConfirming(false);
            }}
          >
            {t("passkeys.cancel")}
          </Button>
          <Button
            isPending={logOutAll.isPending}
            onPress={() => {
              logOutAll.mutate();
            }}
            tone="danger"
          >
            {t("sessions.logOutAll")}
          </Button>
        </Cluster>
      </Dialog>
    </Stack>
  );
};
