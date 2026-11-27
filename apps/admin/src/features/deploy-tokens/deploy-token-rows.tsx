import type { ReactNode } from "react";

import type { DeployTokenSummary } from "@/features/deploy-tokens/queries/deploy-tokens-query";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Stack, Text } from "@/ui/layout";
import { EmptyState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { ActionList, ActionListRow } from "@/ui/primitives/collections";

/** トークンの行の並びに渡す値。 */
type DeployTokenRowsProps = {
  /** 取り消しを始める関数。 */
  onRevoke: (token: DeployTokenSummary) => void;
  /** 発行したデプロイ用のトークン。 */
  tokens: readonly DeployTokenSummary[];
};

/** 発行したトークンの行の並び。 */
export const DeployTokenRows = ({
  tokens,
  onRevoke,
}: DeployTokenRowsProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();

  if (tokens.length === 0) {
    return (
      <EmptyState
        description={t("deployTokens.emptyDescription")}
        icon="key-round"
        title={t("deployTokens.emptyTitle")}
      />
    );
  }

  return (
    <ActionList>
      {tokens.map((token) => {
        const created = formatDateTime(locale, token.createdAt);

        return (
          <li key={token.id}>
            <ActionListRow>
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
            </ActionListRow>
          </li>
        );
      })}
    </ActionList>
  );
};
