import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { LogOutButton } from "../features/session/log-out-button";
import { Center } from "../ui/layout/center";
import { Stack } from "../ui/layout/stack";
import { Text } from "../ui/layout/text";
import { PageHeader } from "../ui/patterns/page-header";
import { Link } from "../ui/primitives/link";

/** ログインした後に最初に開く画面。 */
export const HomePage = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="page">
      <Stack gap={6}>
        <PageHeader actions={<LogOutButton />} title={t("home.title")} />
        <Text>
          <Link href="/security">{t("home.security")}</Link>
        </Text>
      </Stack>
    </Center>
  );
};
