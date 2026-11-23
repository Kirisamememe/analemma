import { useAppContext } from "@/api/app-context";

/** 固定ページの一覧を読む関数。 */
export const useLoadPages = () => {
  const { api } = useAppContext();
  const { admin } = api;

  return async () => admin.fixedPages.list();
};
