import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext, useRouter, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { toLogInNotice } from "@/features/auth/logic/to-auth-notice";
import { logIn } from "@/features/auth/queries/log-in";
import { AppShell, Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { useFailureToast } from "@/ui/primitives/overlays";

/** パスキーでログインする画面。 */
export const LoginPage = (): ReactNode => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { api, authenticator, gate } = useRouteContext({ from: "/login" });
  const { redirect } = useSearch({ from: "/login" });
  const failure = useFailureToast();

  const login = useMutation({
    mutationFn: async () =>
      gate.authenticate(async () => logIn({ api, authenticator })),
    onSuccess: ({ _tag }) => {
      const notice = toLogInNotice(_tag);

      if (notice !== undefined) {
        failure.show(t(notice.message));
      }

      if (_tag !== "LoggedIn") {
        return;
      }

      queryClient.clear();

      if (router.state.matches.some(({ routeId }) => routeId === "/login")) {
        router.history.push(redirect ?? "/");
      }
    },
    onError: () => {
      failure.show(t("login.failed"));
    },
  });

  return (
    <AppShell>
      <Center width="sm">
        <Stack gap={6}>
          <PageHeader
            description={t("login.description")}
            title={t("login.title")}
          />
          <Button
            pendingLabel={t("ui.pending")}
            isPending={login.isPending}
            onPress={() => {
              failure.close();
              login.mutate();
            }}
            tone="primary"
          >
            {t("login.submit")}
          </Button>
        </Stack>
      </Center>
    </AppShell>
  );
};
