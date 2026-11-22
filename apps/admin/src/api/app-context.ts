import {
  type Register,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";

type AppContext = Pick<
  Register["router"]["routeTree"]["types"]["allContext"],
  "api" | "authenticator" | "gate"
>;

/** 管理画面の API・認証器・gate を返す。 */
export const useAppContext = (): AppContext => {
  const { api, authenticator, gate } = useRouteContext({ from: "__root__" });

  return { api, authenticator, gate };
};

/** ログインの画面に移る関数を返す。 */
export const useGoToLogin = (): (() => void) => {
  const router = useRouter();

  return () => {
    void router.navigate({ to: "/login" });
  };
};
