import { passkeyName } from "@analemma/contract";

import type { PlainMessageKey } from "../../i18n/translation";

/** パスキーの名前を contract と同じ決まりで確かめ、合わなければ知らせの訳のキーを返す。 */
export const checkPasskeyName = (value: string): PlainMessageKey | undefined =>
  passkeyName.safeParse(value).success ? undefined : "passkeyName.invalid";
