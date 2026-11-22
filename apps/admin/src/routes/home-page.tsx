import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Center } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

/** ログインした後に最初に開く画面。 */
export const HomePage = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="page">
      <PageHeader title={t("home.title")} />
    </Center>
  );
};
