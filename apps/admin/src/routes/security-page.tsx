import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { PasskeysSection } from "@/features/passkeys/passkeys-section";
import { LogOutAllSection } from "@/features/session/log-out-all-section";
import { Center } from "@/ui/layout/center";
import { Stack } from "@/ui/layout/stack";
import { PageHeader } from "@/ui/patterns/page-header";

/** パスキーとセッションを扱う画面。 */
export const SecurityPage = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="form">
      <Stack gap={8}>
        <PageHeader
          description={t("security.description")}
          title={t("security.title")}
        />
        <PasskeysSection />
        <LogOutAllSection />
      </Stack>
    </Center>
  );
};
