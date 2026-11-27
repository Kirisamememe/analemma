import { useState } from "react";

import { convertingIds, settledSince } from "../logic/conversion-results";
import { useImage } from "./use-image";

import type { ApiOutputs } from "@/api/api-types";
import { findNextConverting } from "@/queries/images-query";

type Pages = readonly ApiOutputs["admin"]["images"]["list"][];

const sameIds = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean =>
  a.size === b.size && [...a].every((id) => b.has(id));

/** 変換中の画像を1枚ずつ取り直し、待っているかと、終えた画像を返す。 */
export const useConversionWatch = (pages: Pages, pollMs?: number) => {
  const converting = convertingIds(pages);
  const [watched, setWatched] = useState(converting);
  const [settled, setSettled] = useState(() => settledSince(watched, pages));

  if (!sameIds(watched, converting)) {
    const done = settledSince(watched, pages);

    setWatched(converting);

    if (done.length > 0) setSettled(done);
  }

  useImage(findNextConverting(pages), {
    isListedAsConverting: true,
    ...(pollMs !== undefined && { pollMs }),
  });

  return { isWatching: converting.size > 0, settled };
};
