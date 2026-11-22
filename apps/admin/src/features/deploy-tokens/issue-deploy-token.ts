import { deployTokenName } from "@analemma/contract";

import { callApi } from "@/api/call-api";
import {
  type ReauthenticateDependencies,
  reauthenticate,
} from "@/features/auth/reauthenticate";
import type { MessageKey } from "@/i18n/use-translate";

/** デプロイ用のトークンを発行した結果。 */
export type IssueDeployTokenResult =
  | {
      /** 結果の種類。 */
      readonly _tag: "Issued";
      /** 発行したトークンの名前(server が前後の空白を除いたもの)。 */
      readonly name: string;
      /** server が発行したときの1回だけ返す token。 */
      readonly token: string;
    }
  | {
      /** 結果の種類。 */
      readonly _tag: "Cancelled" | "ReauthenticationFailed";
    };

/** 名前を contract と同じ決まりで確かめ、合わなければ知らせの訳のキーを返す。 */
export const checkDeployTokenName = (value: string): MessageKey | undefined =>
  deployTokenName.safeParse(value).success
    ? undefined
    : "deployTokens.invalidName";

/** 再認証をしてから、デプロイ用のトークンを発行する。 */
export const issueDeployToken = async (
  dependencies: ReauthenticateDependencies,
  name: string,
): Promise<IssueDeployTokenResult> => {
  const confirmation = await reauthenticate(dependencies);

  if (confirmation._tag === "Cancelled") {
    return { _tag: "Cancelled" };
  }

  const result = await callApi(
    dependencies.api.admin.deployTokens.issue({
      name,
      assertion: confirmation.assertion,
    }),
    ["REAUTHENTICATION_FAILED"],
  );

  return result._tag === "Succeeded"
    ? { _tag: "Issued", name: result.data.name, token: result.data.token }
    : { _tag: "ReauthenticationFailed" };
};
