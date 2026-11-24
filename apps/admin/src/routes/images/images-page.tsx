import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useImageListPosition } from "./use-image-list-position";

import { ImagesSection } from "@/components/images/images-section";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

const imageHref = (id: string): `/images/${string}` => `/images/${id}`;

/** 画像を、写真の縦横比を保って並べる画面。 */
export const ImagesPage = (): ReactNode => {
  const { t } = useTranslation();

  const restorePosition = useImageListPosition();

  return (
    <Center width="page">
      <Stack gap={8}>
        <PageHeader
          description={t("images.description")}
          title={t("images.title")}
        />
        <div ref={restorePosition}>
          <ImagesSection imageHref={imageHref} />
        </div>
      </Stack>
    </Center>
  );
};
