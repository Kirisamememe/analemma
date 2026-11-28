import { useState } from "react";

import { convertingIds, settledSince } from "../logic/conversion-results";
import { useConversionPolling } from "./use-conversion-polling";

import type { ApiOutputs } from "@/api/api-types";
import { findNextConverting } from "@/queries/images-query";

type Pages = readonly ApiOutputs["admin"]["images"]["list"][];

const NONE: ReturnType<typeof settledSince> = [];

const sameIds = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean =>
  a.size === b.size && [...a].every((id) => b.has(id));

/** 変換中の画像を1枚ずつ取り直し、待っているかと、終えた画像を返す。 */
export const useConversionWatch = (pages: Pages, pollMs?: number) => {
  const converting = convertingIds(pages);
  const [watched, setWatched] = useState(converting);
  const [result, setResult] = useState({ round: 0, settled: NONE });

  if (!sameIds(watched, converting)) {
    const settled = settledSince(watched, pages);

    setWatched(converting);

    if (settled.length > 0) setResult({ round: result.round + 1, settled });
  }

  useConversionPolling(findNextConverting(pages), pollMs);

  return { isWatching: converting.size > 0, ...result };
};
