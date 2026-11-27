import { useImage } from "./use-image";

import type { ApiOutputs } from "@/api/api-types";
import { findNextConverting } from "@/queries/images-query";

/** 読み込んだ変換中の画像のうち、いちばん先に受け取った1枚の状態だけを取り直す。 */
export const useConversionWatch = (
  pages: readonly ApiOutputs["admin"]["images"]["list"][],
  pollMs?: number,
): void => {
  useImage(findNextConverting(pages), {
    isListedAsConverting: true,
    ...(pollMs !== undefined && { pollMs }),
  });
};
