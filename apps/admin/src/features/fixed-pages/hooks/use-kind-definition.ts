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

/** 種類の定義を読み、保存済みの中身を表せる定義だけを、タブの中で使い回す。 */
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
