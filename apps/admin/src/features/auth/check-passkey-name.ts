import { passkeyName } from "@analemma/contract";

import type { MessageKey } from "../../i18n/use-translate";

/** パスキーの名前を contract と同じ決まりで確かめ、合わなければ知らせの訳のキーを返す。 */
export const checkPasskeyName = (value: string): MessageKey | undefined =>
  passkeyName.safeParse(value).success ? undefined : "passkeyName.invalid";
