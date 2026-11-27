import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { DeployTokenRows } from "@/features/deploy-tokens/deploy-token-rows";
import {
  DEPLOY_TOKENS_QUERY_KEY,
  loadDeployTokens,
  type DeployTokenSummary,
} from "@/features/deploy-tokens/queries/deploy-tokens-query";
import { useTranslate } from "@/i18n/use-translate";

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
  const { api } = useAppContext();

  const tokens = useApiQuery({
    key: DEPLOY_TOKENS_QUERY_KEY,
    load: () => loadDeployTokens(api),
  });

  return (
    <QueryContent
      failedTitle={t("deployTokens.loadFailed")}
      level={3}
      loading="list"
      query={tokens}
    >
      {(data) => <DeployTokenRows onRevoke={onRevoke} tokens={data.tokens} />}
    </QueryContent>
  );
};
