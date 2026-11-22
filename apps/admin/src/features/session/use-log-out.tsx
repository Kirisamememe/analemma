import { useAppContext, useGoToLogin } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";

/** 今のセッションからログアウトする操作。 */
export const useLogOut = () => {
  const goToLogin = useGoToLogin();
  const { clear } = useApiCache();
  const { api } = useAppContext();

  return useApiMutation({
    send: () => api.admin.session.logOut(),
    onSuccess: () => {
      clear();
      goToLogin();
    },
  });
};
