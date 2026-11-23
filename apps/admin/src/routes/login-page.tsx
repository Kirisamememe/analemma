import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext, useRouter, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { toLogInNotice } from "@/features/auth/logic/to-auth-notice";
import { logIn } from "@/features/auth/queries/log-in";
import { AppShell, Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** パスキーでログインする画面。 */
export const LoginPage = (): ReactNode => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { api, authenticator, gate } = useRouteContext({ from: "/login" });
  const { redirect } = useSearch({ from: "/login" });

  const login = useMutation({
    mutationFn: async () =>
      gate.authenticate(async () => logIn({ api, authenticator })),
    onSuccess: ({ _tag }) => {
      if (_tag !== "LoggedIn") {
        return;
      }

      queryClient.clear();

      if (router.state.matches.some(({ routeId }) => routeId === "/login")) {
        router.history.push(redirect ?? "/");
      }
    },
  });

  const outcome = login.isError ? "Unexpected" : login.data?._tag;
  const notice = outcome === undefined ? undefined : toLogInNotice(outcome);

  return (
    <AppShell>
      <Center width="sm">
        <Stack gap={6}>
          <PageHeader
            description={t("login.description")}
            title={t("login.title")}
          />
          {notice !== undefined && (
            <Notice tone={notice.tone}>{t(notice.message)}</Notice>
          )}
          <Button
            isPending={login.isPending}
            onPress={() => {
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
