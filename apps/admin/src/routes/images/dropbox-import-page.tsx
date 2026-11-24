import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DropboxImport } from "@/features/dropbox/dropbox-import";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Link } from "@/ui/primitives/navigation";

const openUrl = (url: string): void => {
  window.location.assign(url);
};

/** Dropbox につなぎ、App folder の写真を取り込む画面。 */
export const DropboxImportPage = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="page">
      <Stack gap={8}>
        <Stack gap={2}>
          <Link href="/images" variant="back">
            {t("images.title")}
          </Link>
          <PageHeader
            description={t("dropbox.description")}
            title={t("dropbox.title")}
          />
        </Stack>
        <DropboxImport openUrl={openUrl} />
      </Stack>
    </Center>
  );
};
