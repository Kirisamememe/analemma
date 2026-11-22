import type { ParseKeysWithoutVariables } from "i18next";

import { passkeyName } from "@analemma/contract";

/** パスキーの名前を contract と同じ決まりで確かめ、合わなければ知らせの訳のキーを返す。 */
export const checkPasskeyName = (
  value: string,
): ParseKeysWithoutVariables | undefined =>
  passkeyName.safeParse(value).success ? undefined : "passkeyName.invalid";
