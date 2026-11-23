import type { ReactNode } from "react";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import {
  PASSKEYS_QUERY_KEY,
  loadPasskeys,
} from "@/features/passkeys/queries/passkeys-query";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { ErrorState } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

/** 一覧に出す、1つのパスキー。 */
export type PasskeySummary =
  ApiOutputs["admin"]["passkeys"]["list"]["passkeys"][number];

/** パスキーの一覧に渡す値。 */
type PasskeyListProps = {
  /** 名前の変更を始める関数。 */
  onRename: (passkey: PasskeySummary) => void;
  /** 削除を始める関数。 */
  onDelete: (passkey: PasskeySummary) => void;
};

/** 登録したパスキーの一覧。 */
export const PasskeyList = ({
  onRename,
  onDelete,
}: PasskeyListProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const { api } = useAppContext();

  const passkeys = useApiQuery({
    key: PASSKEYS_QUERY_KEY,
    load: () => loadPasskeys(api),
  });

  if (passkeys._tag === "Loading") {
    return <Text tone="muted">{t("passkeys.loading")}</Text>;
  }

  if (passkeys._tag === "Failed") {
    return (
      <ErrorState
        isRetrying={passkeys.isRetrying}
        layout="inline"
        level={3}
        onRetry={passkeys.retry}
        title={t("passkeys.loadFailed")}
      />
    );
  }

  return (
    <Stack as="ul" gap={4}>
      {passkeys.data.passkeys.map((passkey) => (
        <li key={passkey.id}>
          <Cluster align="center" gap={4} justify="between">
            <Stack gap={0.5}>
              <Cluster gap={2}>
                <Text as="span" variant="label">
                  {passkey.name}
                </Text>
                {passkey.backedUp && (
                  <Badge tone="neutral">{t("passkeys.synced")}</Badge>
                )}
              </Cluster>
              <Text tone="muted" variant="caption">
                {t("passkeys.dates", {
                  created: formatDateTime(locale, passkey.createdAt),
                  lastUsed: formatDateTime(locale, passkey.lastUsedAt),
                })}
              </Text>
            </Stack>
            <Cluster gap={2}>
              <Button
                onPress={() => {
                  onRename(passkey);
                }}
                size="sm"
              >
                {t("passkeys.rename")}
              </Button>
              <Button
                aria-label={t("passkeys.deletePasskey", { name: passkey.name })}
                onPress={() => {
                  onDelete(passkey);
                }}
                size="sm"
                tone="danger"
              >
                {t("passkeys.delete")}
              </Button>
            </Cluster>
          </Cluster>
        </li>
      ))}
    </Stack>
  );
};
