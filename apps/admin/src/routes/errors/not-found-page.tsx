import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AppShell, Center, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Link } from "@/ui/primitives/navigation";

/** 無いパスを開いたときの画面。 */
export const NotFoundPage = (): ReactNode => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <AppShell>
      <Center width="page">
        <Stack gap={4}>
          <PageHeader
            description={t("notFound.description", { path: pathname })}
            title={t("notFound.title")}
          />
          <Text>
            <Link href="/">{t("notFound.backHome")}</Link>
          </Text>
        </Stack>
      </Center>
    </AppShell>
  );
};
