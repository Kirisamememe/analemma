import type { ReactNode } from "react";

import type { ConnectionFailure } from "@/features/dropbox/hooks/use-dropbox-connection-actions";
import type { DropboxConnection } from "@/features/dropbox/queries/dropbox-queries";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Stack, Text } from "@/ui/layout";
import { EmptyState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { ActionList, ActionListRow } from "@/ui/primitives/collections";
import { Notice } from "@/ui/primitives/notice";

/** つないだアカウントの行に渡す値。 */
type AccountRowProps = {
  /** つないでいる接続。 */
  connection: Extract<DropboxConnection, Record<"status", "connected">>;
  /** 切る操作を送っているか。 */
  disconnecting: boolean;
  /** 接続を切る。 */
  onDisconnect: () => void;
};

/** つなぐことを促す欄に渡す値。 */
type ConnectPromptProps = {
  /** 認可の画面の URL を作らせているか。 */
  opening: boolean;
  /** Dropbox の認可の画面へ移る。 */
  onOpen: () => void;
};

/** つなぐ操作と切る操作のうまくいかなかった理由を渡す値。 */
type ConnectionNoticeProps = {
  /** うまくいかなかった理由。 */
  failure: ConnectionFailure | undefined;
};

/** つないでいるアカウントと、切る操作の行。 */
export const AccountRow = ({
  connection,
  disconnecting,
  onDisconnect,
}: AccountRowProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();

  return (
    <ActionList as="div">
      <ActionListRow>
        <Stack gap={0.5}>
          <Text tone="muted" variant="caption">
            {t("dropbox.account")}
          </Text>
          <Text variant="label">{connection.accountName}</Text>
          <Text tone="muted" variant="caption">
            {t("dropbox.accountDetail", {
              email: connection.accountEmail,
              date: formatDateTime(locale, connection.connectedAt),
            })}
          </Text>
        </Stack>
        <Button isPending={disconnecting} onPress={onDisconnect}>
          {t("dropbox.disconnect")}
        </Button>
      </ActionListRow>
    </ActionList>
  );
};

/** まだつないでいないことと、つなぐ操作。 */
export const ConnectPrompt = ({
  opening,
  onOpen,
}: ConnectPromptProps): ReactNode => {
  const t = useTranslate();

  return (
    <EmptyState
      actions={
        <Button isPending={opening} onPress={onOpen} tone="primary">
          {t("dropbox.connect")}
        </Button>
      }
      description={t("dropbox.disconnectedDescription")}
      icon="cloud-alert"
      title={t("dropbox.disconnectedTitle")}
    />
  );
};

/** つなぐ操作と切る操作が、うまくいかなかったことの知らせ。 */
export const ConnectionNotice = ({
  failure,
}: ConnectionNoticeProps): ReactNode => {
  const t = useTranslate();

  return failure === undefined ? null : (
    <Notice tone={failure === "Failed" ? "danger" : "warning"}>
      {t(`dropbox.connectionFailure.${failure}`)}
    </Notice>
  );
};
