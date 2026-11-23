import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import {
  DEPLOY_TOKENS_QUERY_KEY,
  loadDeployTokens,
  type DeployTokenSummary,
} from "@/features/deploy-tokens/queries/deploy-tokens-query";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { EmptyState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** デプロイ用のトークンの一覧に渡す値。 */
type DeployTokenListProps = {
  /** 取り消しを始める関数。 */
  onRevoke: (token: DeployTokenSummary) => void;
};

/** 発行したデプロイ用のトークンの一覧。 */
export const DeployTokenList = ({
  onRevoke,
}: DeployTokenListProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const { api } = useAppContext();

  const tokens = useApiQuery({
    key: DEPLOY_TOKENS_QUERY_KEY,
    load: () => loadDeployTokens(api),
  });

  if (tokens._tag === "Loading") {
    return <Text tone="muted">{t("deployTokens.loading")}</Text>;
  }

  if (tokens._tag === "Failed") {
    return <Notice tone="danger">{t("deployTokens.loadFailed")}</Notice>;
  }

  if (tokens.data.tokens.length === 0) {
    return (
      <EmptyState
        description={t("deployTokens.emptyDescription")}
        icon="key-round"
        title={t("deployTokens.emptyTitle")}
      />
    );
  }

  return (
    <Stack as="ul" gap={4}>
      {tokens.data.tokens.map((token) => {
        const created = formatDateTime(locale, token.createdAt);

        return (
          <li key={token.id}>
            <Cluster align="center" gap={4} justify="between">
              <Stack gap={0.5}>
                <Text as="span" variant="label">
                  {token.name}
                </Text>
                <Text tone="muted" variant="caption">
                  {token.lastUsedAt === null
                    ? t("deployTokens.datesUnused", { created })
                    : t("deployTokens.dates", {
                        created,
                        lastUsed: formatDateTime(locale, token.lastUsedAt),
                      })}
                </Text>
              </Stack>
              <Button
                aria-label={t("deployTokens.revokeToken", { name: token.name })}
                onPress={() => {
                  onRevoke(token);
                }}
                size="sm"
                tone="danger"
              >
                {t("deployTokens.revoke")}
              </Button>
            </Cluster>
          </li>
        );
      })}
    </Stack>
  );
};
