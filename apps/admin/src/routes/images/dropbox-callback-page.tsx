import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DropboxReturn } from "@/features/dropbox/dropbox-return";
import { readCallbackSearch } from "@/features/dropbox/logic/callback-search";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

/** Dropbox の認可の画面から戻り、つないでから取り込みの画面へ移る画面。 */
export const DropboxCallbackPage = (): ReactNode => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: "/signed-in/images/dropbox/callback" });

  return (
    <Center width="page">
      <Stack gap={8}>
        <PageHeader title={t("dropbox.title")} />
        <DropboxReturn
          onConnected={() => {
            void navigate({ to: "/images/dropbox", replace: true });
          }}
          search={readCallbackSearch(search)}
        />
      </Stack>
    </Center>
  );
};
