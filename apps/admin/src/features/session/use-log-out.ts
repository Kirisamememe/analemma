import { useRef } from "react";

import { useAppContext, useGoToLogin } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { useShowToast } from "@/ui/primitives/overlays";

/** 今のセッションからログアウトする操作。 */
export const useLogOut = () => {
  const t = useTranslate();
  const showToast = useShowToast();
  const goToLogin = useGoToLogin();
  const { clear } = useApiCache();
  const { api } = useAppContext();
  const closeFailure = useRef<() => void>(undefined); // 前の失敗の Toast を閉じる関数
  const logOut = useApiMutation({
    send: () => api.admin.session.logOut(),
    onSuccess: () => {
      clear();
      goToLogin();
    },
    onError: () => {
      closeFailure.current = showToast({
        tone: "danger",
        message: t("session.logOutFailed"),
      });
    },
  });

  return {
    isPending: logOut.isPending,
    mutate: (): void => {
      closeFailure.current?.();
      closeFailure.current = undefined;
      logOut.mutate();
    },
  };
};
