import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cluster } from "../../ui/layout/cluster";
import { Heading } from "../../ui/layout/heading";
import { Stack } from "../../ui/layout/stack";
import { Text } from "../../ui/layout/text";
import { Button } from "../../ui/primitives/button";
import { Dialog } from "../../ui/primitives/dialog";
import { Notice } from "../../ui/primitives/notice";

/** すべてのセッションからログアウトする操作。 */
export const LogOutAllSection = (): ReactNode => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { api } = useRouteContext({ from: "__root__" });
  const [isConfirming, setConfirming] = useState(false);
  const logOutAll = useMutation({
    mutationFn: async () => api.admin.session.logOutAll(),
    onSuccess: () => {
      queryClient.clear();
      void router.navigate({ to: "/login" });
    },
  });

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
        onOpenChange={(open) => {
          logOutAll.reset();
          setConfirming(open);
        }}
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
              logOutAll.reset();
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
