import { type ReactNode, useState } from "react";

import { useAppContext, useGoToLogin } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { sendLogOutAll } from "@/features/session/queries/log-out";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog, useFailureToast } from "@/ui/primitives/overlays";

/** すべてのセッションからログアウトする操作。 */
export const LogOutAllSection = (): ReactNode => {
  const t = useTranslate();
  const goToLogin = useGoToLogin();
  const { clear } = useApiCache();
  const { api } = useAppContext();
  const [isConfirming, setConfirming] = useState(false);
  const failure = useFailureToast();

  const logOutAll = useApiMutation({
    send: () => sendLogOutAll(api),
    onSuccess: () => {
      clear();
      goToLogin();
    },
    onError: () => {
      failure.show(t("sessions.logOutAllFailed"));
    },
  });

  const changeOpen = (open: boolean): void => {
    if (!open) failure.close();

    setConfirming(open);
  };

  return (
    <Stack as="section" gap={4}>
      <Heading level={2}>{t("sessions.title")}</Heading>
      <Text tone="muted">{t("sessions.description")}</Text>
      <Cluster>
        <Button
          onPress={() => {
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
        onOpenChange={changeOpen}
        title={t("sessions.logOutAllTitle")}
      >
        <Text>{t("sessions.description")}</Text>
        <Cluster gap={2} justify="end">
          <Button
            isDisabled={logOutAll.isPending}
            onPress={() => {
              failure.close();
              setConfirming(false);
            }}
          >
            {t("passkeys.cancel")}
          </Button>
          <Button
            pendingLabel={t("ui.pending")}
            isPending={logOutAll.isPending}
            onPress={() => {
              failure.close();
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
