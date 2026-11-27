import type { ReactNode } from "react";

import type { ApiOutputs } from "@/api/api-types";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { ActionListRow } from "@/ui/primitives/collections";

/** 一覧に出す、1つのパスキー。 */
export type PasskeySummary =
  ApiOutputs["admin"]["passkeys"]["list"]["passkeys"][number];

/** パスキーの行に渡す値。 */
type PasskeyRowProps = {
  /** 行に出すパスキー。 */
  passkey: PasskeySummary;
  /** 名前の変更を始める関数。 */
  onRename: (passkey: PasskeySummary) => void;
  /** 削除を始める関数。 */
  onDelete: (passkey: PasskeySummary) => void;
};

/** パスキー1つの、名前・日時と、名前の変更・削除の操作。 */
export const PasskeyRow = ({
  passkey,
  onRename,
  onDelete,
}: PasskeyRowProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();

  return (
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
          aria-label={t("passkeys.renamePasskey", { name: passkey.name })}
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
    </ActionListRow>
  );
};
