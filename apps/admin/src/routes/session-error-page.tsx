import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Center } from "../ui/layout/center";
import { Stack } from "../ui/layout/stack";
import { PageHeader } from "../ui/patterns/page-header";
import { Button } from "../ui/primitives/button";
import { Notice } from "../ui/primitives/notice";

/** セッションを確かめられなかったときの画面。 */
export const SessionErrorPage = (): ReactNode => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
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
  );
};
