import type { KindDefinitionInput } from "@analemma/contract";

import { answerReauthentication } from "@/test-client/answer-authentication";
import type { TestClient } from "@/test-client/create-test-client";
import {
  type TestPasskey,
  signInAsAdmin,
} from "@/test-client/sign-in-as-admin";

/** テストのために、ログイン中の管理者として、確かめ直してからデプロイ用のトークンを発行する。 */
export const issueTestDeployToken = async (
  server: TestClient,
  passkey: TestPasskey,
): Promise<string> =>
  (
    await server.client.admin.deployTokens.issue({
      name: "テストのデプロイ",
      assertion: await answerReauthentication(server, passkey),
    })
  ).token;

/** テストのために、管理者としてログインし、種類の定義を送る。 */
export const prepareTestKinds = async (
  server: TestClient,
  kinds: readonly KindDefinitionInput[],
): Promise<string> => {
  const { passkey } = await signInAsAdmin(server);
  const token = await issueTestDeployToken(server, passkey);

  await server.internal(token).deploy.kinds.push({ kinds: [...kinds] });

  return token;
};
