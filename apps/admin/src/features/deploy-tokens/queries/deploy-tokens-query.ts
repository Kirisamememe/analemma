import type { ApiClient, ApiOutputs } from "@/api/api-types";

/** 一覧に出す、1つのデプロイ用のトークン。 */
export type DeployTokenSummary =
  ApiOutputs["admin"]["deployTokens"]["list"]["tokens"][number];

/** デプロイ用のトークンの一覧の、query のキー。 */
export const DEPLOY_TOKENS_QUERY_KEY = [
  "admin",
  "deployTokens",
  "list",
] as const;

/** 発行したデプロイ用のトークンの一覧を読む。 */
export const loadDeployTokens = (api: ApiClient) =>
  api.admin.deployTokens.list();
