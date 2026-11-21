import type { ReactNode } from "react";

import { LogOutButton } from "../features/auth/log-out-button";
import { useTranslation } from "../i18n/use-translation";
import { Center } from "../ui/layout/center";
import { PageHeader } from "../ui/patterns/page-header";

/** ログインした後に最初に開く画面。 */
export const HomePage = (): ReactNode => {
  const t = useTranslation();

  return (
    <Center width="page">
      <PageHeader actions={<LogOutButton />} title={t("home.title")} />
    </Center>
  );
};
