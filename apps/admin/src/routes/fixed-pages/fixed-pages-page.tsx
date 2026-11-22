import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { FixedPagesSection } from "@/features/fixed-pages/list/fixed-pages-section";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

/** 固定ページを一覧し、並べ直す画面。 */
export const FixedPagesPage = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="form">
      <Stack gap={8}>
        <PageHeader
          description={t("fixedPages.description")}
          title={t("fixedPages.title")}
        />
        <FixedPagesSection />
      </Stack>
    </Center>
  );
};
