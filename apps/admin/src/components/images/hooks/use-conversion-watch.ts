import { useImage } from "./use-image";

import type { ApiOutputs } from "@/api/api-types";
import { findNextConverting } from "@/queries/images-query";

/** 読み込んだ画像の一覧の中で、次に変換を終える画像の状態だけを取り直す。 */
export const useConversionWatch = (
  pages: readonly ApiOutputs["admin"]["images"]["list"][],
  pollMs?: number,
): void => {
  useImage(findNextConverting(pages), pollMs === undefined ? {} : { pollMs });
};
