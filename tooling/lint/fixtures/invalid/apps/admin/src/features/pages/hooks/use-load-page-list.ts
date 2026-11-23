import { useAppContext } from "@/api/app-context";

/** 固定ページの一覧を読む関数。 */
export const useLoadPageList = () => {
  const {
    api: { admin },
  } = useAppContext();

  return async () => admin.fixedPages.list();
};
