import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useTranslation } from "../../i18n/use-translation";
import { Cluster } from "../../ui/layout/cluster";
import { Text } from "../../ui/layout/text";
import { Button } from "../../ui/primitives/button";

/** 今のセッションからログアウトするボタン。 */
export const LogOutButton = (): ReactNode => {
  const t = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { api } = useRouteContext({ from: "__root__" });
  const logOut = useMutation({
    mutationFn: async () => api.admin.session.logOut(),
    onSuccess: () => {
      queryClient.clear();
      void router.navigate({ to: "/login" });
    },
  });

  return (
    <Cluster gap={2}>
      {logOut.isError && (
        <Text as="span" tone="danger" variant="caption">
          {t("session.logOutFailed")}
        </Text>
      )}
      <Button
        isPending={logOut.isPending}
        onPress={() => {
          logOut.mutate();
        }}
      >
        {t("session.logOut")}
      </Button>
    </Cluster>
  );
};
