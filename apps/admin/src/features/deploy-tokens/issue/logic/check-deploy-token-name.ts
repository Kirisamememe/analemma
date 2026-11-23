import { deployTokenName } from "@analemma/contract";

import type { MessageKey } from "@/i18n/use-translate";

/** 名前を contract と同じ決まりで確かめ、合わなければ知らせの訳のキーを返す。 */
export const checkDeployTokenName = (value: string): MessageKey | undefined =>
  deployTokenName.safeParse(value).success
    ? undefined
    : "deployTokens.invalidName";
