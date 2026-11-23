import { useAppContext, useGoToLogin } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { sendLogOut } from "@/features/session/queries/log-out";
import { useTranslate } from "@/i18n/use-translate";
import { useFailureToast } from "@/ui/primitives/overlays";

/** 今のセッションからログアウトする操作。 */
export const useLogOut = () => {
  const t = useTranslate();
  const failure = useFailureToast();
  const goToLogin = useGoToLogin();
  const { clear } = useApiCache();
  const { api } = useAppContext();
  const logOut = useApiMutation({
    send: () => sendLogOut(api),
    onSuccess: () => {
      clear();
      goToLogin();
    },
    onError: () => {
      failure.show(t("session.logOutFailed"));
    },
  });

  return {
    isPending: logOut.isPending,
    mutate: (): void => {
      failure.close();
      logOut.mutate();
    },
  };
};
