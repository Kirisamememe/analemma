import { useMemo } from "react";

import type { FixedPageContent } from "@analemma/contract";

import { useAppContext } from "@/api/app-context";
import { callApi } from "@/api/call-api";
import { useApiQuery } from "@/api/server-state/server-state";
import { storedContentCheck } from "@/features/fixed-pages/editor/create-editor-values";
import {
  KIND_STALE_TIME,
  kindQueryKey,
} from "@/features/fixed-pages/queries/fixed-pages-query";

/** 種類の定義を読み、保存済みの中身を編集できる定義だけを使い回す。 */
export const useKind = (
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
    load:
      name === undefined
        ? undefined
        : async () => {
            const result = await callApi(api.admin.kinds.get({ name }), [
              "NOT_FOUND",
            ]);

            if (result._tag === "Succeeded" && !fits(result.data.fields)) {
              throw new Error("種類の定義で保存済みの中身を編集できません");
            }

            return result;
          },
  });
};
