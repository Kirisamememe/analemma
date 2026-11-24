import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import {
  DROPBOX_PHOTOS_KEY,
  type DropboxPhotos as Listing,
  loadDropboxPhotos,
} from "@/features/dropbox/queries/dropbox-queries";
import { ImportSummary } from "@/features/dropbox/ui/import-summary";
import { PhotoList } from "@/features/dropbox/ui/photo-list";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { EmptyState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** つなぎ直す操作を渡す値。 */
type DropboxPhotosProps = {
  /** 認可の画面の URL を作らせているか。 */
  reconnecting: boolean;
  /** つなぎ直す。 */
  onReconnect: () => void;
};

/** App folder の写真の一覧と、取り込む操作の欄。 */
export const DropboxPhotos = ({
  reconnecting,
  onReconnect,
}: DropboxPhotosProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();

  const photos = useApiQuery({
    key: DROPBOX_PHOTOS_KEY,
    load: async () => loadDropboxPhotos(api),
  });

  const content = (listing: Listing): ReactNode => {
    if (listing._tag !== "Listed") {
      return (
        <Notice tone="warning">
          <Cluster align="center" gap={3} justify="between">
            <Text>{t("dropbox.connectionLost")}</Text>
            <Button isPending={reconnecting} onPress={onReconnect} size="sm">
              {t("dropbox.reconnect")}
            </Button>
          </Cluster>
        </Notice>
      );
    }

    return (
      <Stack gap={4}>
        <ImportSummary />
        {listing.photos.length === 0 ? (
          <EmptyState
            description={t("dropbox.photosEmptyDescription")}
            icon="image-off"
            title={t("dropbox.photosEmptyTitle")}
          />
        ) : (
          <PhotoList ids={listing.photos.map(({ id }) => id)} />
        )}
      </Stack>
    );
  };

  return (
    <Stack as="section" gap={4}>
      <Heading level={2}>{t("dropbox.photosTitle")}</Heading>
      <QueryContent
        failedTitle={t("dropbox.photosLoadFailed")}
        level={3}
        loading="list"
        query={photos}
      >
        {content}
      </QueryContent>
    </Stack>
  );
};
