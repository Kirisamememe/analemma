import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { FixedPagesSection } from "@/features/fixed-pages/list/fixed-pages-section";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";

/** 固定ページを一覧し、並べ直す画面。 */
export const FixedPagesPage = (): ReactNode => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const create = (): void => {
    void navigate({ to: "/fixed-pages/new" });
  };

  return (
    <Center width="form">
      <Stack gap={8}>
        <PageHeader
          actions={
            <Button onPress={create} tone="primary">
              {t("fixedPages.create")}
            </Button>
          }
          description={t("fixedPages.description")}
          title={t("fixedPages.title")}
        />
        <FixedPagesSection
          onCreate={create}
          onEdit={(id) => {
            void navigate({ to: "/fixed-pages/$id", params: { id } });
          }}
        />
      </Stack>
    </Center>
  );
};
