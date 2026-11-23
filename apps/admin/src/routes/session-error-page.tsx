import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AppShell, Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** セッションを確かめられなかったときの画面。 */
export const SessionErrorPage = (): ReactNode => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <AppShell>
      <Center width="sm">
        <Stack gap={6}>
          <PageHeader title={t("sessionError.title")} />
          <Notice tone="danger">{t("sessionError.description")}</Notice>
          <Button
            onPress={() => {
              void router.invalidate();
            }}
            tone="primary"
          >
            {t("sessionError.retry")}
          </Button>
        </Stack>
      </Center>
    </AppShell>
  );
};
