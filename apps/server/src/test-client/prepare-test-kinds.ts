import type { KindDefinitionInput } from "@analemma/contract";

import type { TestClient } from "./create-test-client";
import { signInAsAdmin } from "./sign-in-as-admin";

/** テストのために、管理者としてデプロイ用のトークンを発行する。 */
export const issueTestDeployToken = async (
  server: TestClient,
): Promise<string> =>
  (await server.client.admin.deployTokens.issue({ name: "テストのデプロイ" }))
    .token;

/** テストのために、管理者としてログインし、種類の定義を送る。 */
export const prepareTestKinds = async (
  server: TestClient,
  kinds: readonly KindDefinitionInput[],
): Promise<string> => {
  await signInAsAdmin(server);

  const token = await issueTestDeployToken(server);

  await server.internal(token).deploy.kinds.push({ kinds: [...kinds] });

  return token;
};
