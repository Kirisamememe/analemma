import { useMemo } from "react";

import type { FixedPageContent } from "@analemma/contract";

import { storedContentCheck } from "../editor/create-editor-values";
import {
  KIND_STALE_TIME,
  kindQueryKey,
  loadKind,
} from "../queries/fixed-pages-query";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";

/** 固定ページの作成と編集に使う、種類の定義を読む。 */
export const useKindDefinition = (
  name: string | undefined,
  content?: FixedPageContent,
) => {
  const { api } = useAppContext();
  const fits = useMemo(() => storedContentCheck(content), [content]);

  return useApiQuery({
    key: kindQueryKey(name),
    tabStaleTime: (kind) =>
      kind?._tag === "Succeeded" && fits(kind.data.fields)
        ? KIND_STALE_TIME
        : 0,
    load: name === undefined ? undefined : () => loadKind(api, { name, fits }),
  });
};
