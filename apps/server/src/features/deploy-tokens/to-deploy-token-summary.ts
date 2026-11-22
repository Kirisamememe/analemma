import type { InferContractRouterOutputs } from "@orpc/contract";

import type { contract } from "@analemma/contract";

import type { DeployTokenRow } from "@/features/deploy-tokens/queries/deploy-tokens.query";

/** 管理画面に返す、デプロイ用のトークン。 */
export type DeployTokenSummary = InferContractRouterOutputs<
  typeof contract
>["admin"]["deployTokens"]["list"]["tokens"][number];

/** デプロイ用のトークンの行を、管理画面に返す形にする。 */
export const toDeployTokenSummary = (
  row: DeployTokenRow,
): DeployTokenSummary => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
});
