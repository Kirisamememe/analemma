import type { ReactNode } from "react";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import {
  PASSKEYS_QUERY_KEY,
  loadPasskeys,
} from "@/features/passkeys/queries/passkeys-query";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { ActionList, ActionListRow, Cluster, Stack, Text } from "@/ui/layout";
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

  return (
    <QueryContent
      failedTitle={t("passkeys.loadFailed")}
      level={3}
      loading="list"
      query={passkeys}
    >
      {({ passkeys: list }) => (
        <ActionList>
          {list.map((passkey) => (
            <li key={passkey.id}>
              <ActionListRow>
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
                    aria-label={t("passkeys.renamePasskey", {
                      name: passkey.name,
                    })}
                    onPress={() => {
                      onRename(passkey);
                    }}
                    size="sm"
                  >
                    {t("passkeys.rename")}
                  </Button>
                  <Button
                    aria-label={t("passkeys.deletePasskey", {
                      name: passkey.name,
                    })}
                    onPress={() => {
                      onDelete(passkey);
                    }}
                    size="sm"
                    tone="danger"
                  >
                    {t("passkeys.delete")}
                  </Button>
                </Cluster>
              </ActionListRow>
            </li>
          ))}
        </ActionList>
      )}
    </QueryContent>
  );
};
