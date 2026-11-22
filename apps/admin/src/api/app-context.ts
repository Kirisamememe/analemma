import { useRouteContext, useRouter } from "@tanstack/react-router";

import type { RouterContext } from "../router";

/** 管理画面の API・認証器・gate を返す。 */
export const useAppContext = (): RouterContext =>
  useRouteContext({ from: "__root__" });

/** ログインの画面に移る関数を返す。 */
export const useGoToLogin = (): (() => void) => {
  const router = useRouter();

  return () => {
    void router.navigate({ to: "/login" });
  };
};
