import { expect, test } from "bun:test";

import { loadDeployTokens } from "@/features/deploy-tokens/queries/deploy-tokens-query";
import { createFakeApi } from "@/testing/create-fake-api";

test("デプロイ用のトークンの一覧を server から読むこと", async () => {
  const { api, calls } = createFakeApi({
    "admin/deployTokens/list": () => ({ output: { tokens: [] } }),
  });

  expect(await loadDeployTokens(api)).toEqual({ tokens: [] });
  expect(calls).toEqual(["admin/deployTokens/list"]);
});
