import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DeployTokensSection } from "@/features/deploy-tokens/deploy-tokens-section";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

/** デプロイ用のトークンを発行し、取り消す画面。 */
export const DeployTokensPage = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="form">
      <Stack gap={8}>
        <PageHeader
          description={t("deployTokens.description")}
          title={t("deployTokens.title")}
        />
        <DeployTokensSection />
      </Stack>
    </Center>
  );
};
