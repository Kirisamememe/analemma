import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { DropboxPhotos } from "@/features/dropbox/dropbox-photos";
import { useDropboxConnectionActions } from "@/features/dropbox/hooks/use-dropbox-connection-actions";
import {
  DROPBOX_CONNECTION_KEY,
  type DropboxConnection,
  loadDropboxConnection,
} from "@/features/dropbox/queries/dropbox-queries";
import {
  AccountRow,
  ConnectionNotice,
  ConnectPrompt,
} from "@/features/dropbox/ui/connection-panel";
import { useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { Notice } from "@/ui/primitives/notice";

/** 取り込みの画面に渡す値。 */
type DropboxImportProps = {
  /** Dropbox の認可の画面を開く。 */
  openUrl: (url: string) => void;
};

/** Dropbox との接続と、App folder の写真を取り込む欄。 */
export const DropboxImport = ({ openUrl }: DropboxImportProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();
  const actions = useDropboxConnectionActions(openUrl);

  const connection = useApiQuery({
    key: DROPBOX_CONNECTION_KEY,
    load: async () => loadDropboxConnection(api),
  });

  const content = (state: DropboxConnection): ReactNode => {
    switch (state.status) {
      case "unconfigured": {
        return <Notice tone="warning">{t("dropbox.unconfigured")}</Notice>;
      }
      case "disconnected": {
        return (
          <ConnectPrompt onOpen={actions.open} opening={actions.opening} />
        );
      }
      case "connected": {
        return (
          <Stack gap={8}>
            <AccountRow
              connection={state}
              disconnecting={actions.disconnecting}
              onDisconnect={actions.disconnect}
            />
            <DropboxPhotos
              onReconnect={actions.open}
              reconnecting={actions.opening}
            />
          </Stack>
        );
      }
    }
  };

  return (
    <Stack gap={4}>
      <ConnectionNotice failure={actions.failure} />
      <QueryContent
        failedTitle={t("dropbox.loadFailed")}
        level={2}
        loading="list"
        query={connection}
      >
        {content}
      </QueryContent>
    </Stack>
  );
};
