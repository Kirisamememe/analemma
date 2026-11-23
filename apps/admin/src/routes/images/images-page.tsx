import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ImagesSection } from "@/features/images/list/images-section";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

/** 画像を、写真の縦横比を保って並べる画面。 */
export const ImagesPage = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="page">
      <Stack gap={8}>
        <PageHeader
          description={t("images.description")}
          title={t("images.title")}
        />
        <ImagesSection imageHref={(id) => `/images/${id}`} />
      </Stack>
    </Center>
  );
};
