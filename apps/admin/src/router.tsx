import { safe } from "@orpc/client";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  type RouterHistory,
} from "@tanstack/react-router";

import type { ApiClient } from "./api/api-types";
import { createQueryClient } from "./api/create-query-client";
import { isUnauthorized } from "./api/is-unauthorized";
import type { AuthGate } from "./features/auth/create-auth-gate";
import { isPublicPath, toLoginSearch } from "./features/auth/login-search";
import type { Authenticator } from "./features/auth/webauthn/create-authenticator";
import { EnrollPage } from "./routes/enroll-page";
import { HomePage } from "./routes/home-page";
import { LoginPage } from "./routes/login-page";
import { NotFoundPage } from "./routes/not-found-page";
import { RootLayout } from "./routes/root-layout";
import { SessionErrorPage } from "./routes/session-error-page";

/** 画面が route から受け取る、server と認証器の窓口。 */
export type RouterContext = {
  /** server の API。 */
  readonly api: ApiClient;
  /** パスキーの認証器。 */
  readonly authenticator: Authenticator;
  /** ログインの最中に、管理用 API を送らせない門。 */
  readonly gate: AuthGate;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: toLoginSearch,
  component: LoginPage,
});

const enrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/enroll",
  component: EnrollPage,
});

const signedInRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "signed-in",
  errorComponent: SessionErrorPage,
  beforeLoad: async ({ context, location }) => {
    const [error] = await safe(context.api.admin.session.get());

    if (error !== null && isUnauthorized(error)) {
      redirect({
        to: "/login",
        search: toLoginSearch({ redirect: location.href }),
        throw: true,
      });
    }

    if (error !== null) {
      throw error;
    }
  },
});

const homeRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  enrollRoute,
  signedInRoute.addChildren([homeRoute]),
]);

/** 管理画面を組み立てるときに渡す値。 */
export type AppDependencies = RouterContext & {
  /** 画面の履歴。 */
  readonly history: RouterHistory;
};

const createAppRouter = ({
  history,
  api,
  authenticator,
  gate,
}: AppDependencies) =>
  createRouter({ routeTree, history, context: { api, authenticator, gate } });

/** 管理画面の router。 */
export type AppRouter = ReturnType<typeof createAppRouter>;

/** 組み立てた管理画面の、router と query client。 */
export type AppParts = {
  /** 管理画面の router。 */
  readonly router: AppRouter;
  /** server の状態を持つ query client。 */
  readonly queryClient: QueryClient;
};

/** router と、セッションが切れたらログインの画面に移す query client を組み立てる。 */
export const createApp = (dependencies: AppDependencies): AppParts => {
  const router = createAppRouter(dependencies);
  const queryClient = createQueryClient({
    onUnauthorized: (client) => {
      client.clear();

      if (isPublicPath(router.state.location.pathname)) {
        return;
      }

      void router.navigate({
        to: "/login",
        search: toLoginSearch({ redirect: router.state.location.href }),
      });
    },
  });

  return { router, queryClient };
};

declare module "@tanstack/react-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- TanStack Router の型の登録は、interface の宣言のマージでしか書けない
  interface Register {
    /** 管理画面の router。 */
    router: AppRouter;
  }
}
