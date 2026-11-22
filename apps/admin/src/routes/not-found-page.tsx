import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Center } from "../ui/layout/center";
import { Stack } from "../ui/layout/stack";
import { Text } from "../ui/layout/text";
import { PageHeader } from "../ui/patterns/page-header";
import { Link } from "../ui/primitives/link";

/** 無いパスを開いたときの画面。 */
export const NotFoundPage = (): ReactNode => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
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
  );
};
