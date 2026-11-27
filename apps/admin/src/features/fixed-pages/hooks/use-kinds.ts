import {
  KIND_STALE_TIME,
  KINDS_QUERY_KEY,
  loadKinds,
} from "../queries/fixed-pages-query";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";

/** 固定ページのタブの中で使い回す、種類の一覧を読む。 */
export const useKinds = () => {
  const { api } = useAppContext();

  return useApiQuery({
    key: KINDS_QUERY_KEY,
    tabStaleTime: KIND_STALE_TIME,
    load: () => loadKinds(api),
  });
};
