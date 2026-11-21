import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { type ReactNode, use } from "react";

import type { ApiOutputs } from "../../api/api-types";
import { formatDateTime } from "../../i18n/format-date-time";
import { LocaleContext } from "../../i18n/locale-context";
import { useTranslation } from "../../i18n/use-translation";
import { Cluster } from "../../ui/layout/cluster";
import { Stack } from "../../ui/layout/stack";
import { Text } from "../../ui/layout/text";
import { Badge } from "../../ui/primitives/badge";
import { Button } from "../../ui/primitives/button";
import { Notice } from "../../ui/primitives/notice";
import { PASSKEYS_QUERY_KEY } from "./passkeys-query";

/** 一覧に出す、1つのパスキー。 */
export type PasskeySummary =
  ApiOutputs["admin"]["passkeys"]["list"]["passkeys"][number];

/** パスキーの一覧に渡す値。 */
type PasskeyListProps = {
  /** 名前を変える操作を始める関数。 */
  readonly onRename: (passkey: PasskeySummary) => void;
  /** 消す操作を始める関数。 */
  readonly onDelete: (passkey: PasskeySummary) => void;
};

/** 登録したパスキーの一覧。 */
export const PasskeyList = ({
  onRename,
  onDelete,
}: PasskeyListProps): ReactNode => {
  const t = useTranslation();
  const locale = use(LocaleContext);
  const { api } = useRouteContext({ from: "__root__" });
  const passkeys = useQuery({
    queryKey: PASSKEYS_QUERY_KEY,
    queryFn: async () => api.admin.passkeys.list(),
  });

  if (passkeys.isPending) {
    return <Text tone="muted">{t("passkeys.loading")}</Text>;
  }

  if (passkeys.isError) {
    return <Notice tone="danger">{t("passkeys.loadFailed")}</Notice>;
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
                {t("passkeys.created", {
                  date: formatDateTime(locale, passkey.createdAt),
                })}
                {" ・ "}
                {t("passkeys.lastUsed", {
                  date: formatDateTime(locale, passkey.lastUsedAt),
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
