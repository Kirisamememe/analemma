import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router";

import type { ApiClient } from "@/api/api-types";
import { createQueryClient } from "@/api/create-query-client";
import type { AuthGate } from "@/features/auth/create-auth-gate";
import {
  isPublicPath,
  toLoginSearch,
} from "@/features/auth/logic/login-search";
import type { Authenticator } from "@/features/auth/webauthn";
import { DeployTokensPage } from "@/routes/deploy-tokens/deploy-tokens-page";
import { EnrollPage } from "@/routes/enroll-page";
import {
  EditFixedPage,
  NewFixedPage,
} from "@/routes/fixed-pages/fixed-page-routes";
import { FixedPagesPage } from "@/routes/fixed-pages/fixed-pages-page";
import { HomePage } from "@/routes/home-page";
import { LoginPage } from "@/routes/login-page";
import { NotFoundPage } from "@/routes/not-found-page";
import { RootLayout } from "@/routes/root-layout";
import { SecurityPage } from "@/routes/security-page";
import { SessionErrorPage } from "@/routes/session-error-page";
import { SignedInLayout } from "@/routes/signed-in-layout";

/** 画面が route から受け取る、server と認証器の窓口。 */
export type RouterContext = {
  /** server の API。 */
  readonly api: ApiClient;
  /** パスキーの認証器。 */
  readonly authenticator: Authenticator;
  /** ログインの最中に、管理用 API を送らせない gate。 */
  readonly gate: AuthGate;
  /** server の状態を持つ query client。 */
  readonly queryClient: QueryClient;
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
  component: SignedInLayout,
  errorComponent: SessionErrorPage,
  beforeLoad: ({ context: { api, queryClient } }) => {
    void queryClient
      .query({
        queryKey: ["admin", "session"],
        queryFn: () => api.admin.session.get(),
        retry: false,
      })
      .catch(() => undefined); // 401 は query client がログインの画面へ移す
  },
});

const homeRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/",
  component: HomePage,
});

const fixedPagesRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/fixed-pages",
  component: FixedPagesPage,
});

const securityRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/security",
  component: SecurityPage,
});

type NewFixedPageSearch = {
  /** 選んだ種類の名前。 */
  kind?: string;
};

const newFixedPageRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/fixed-pages/new",
  validateSearch: ({ kind }): NewFixedPageSearch => {
    if (typeof kind === "string") return { kind };

    if (typeof kind === "boolean" || kind === null) {
      return { kind: String(kind) };
    }

    return {};
  },
  component: NewFixedPage,
});

const editFixedPageRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/fixed-pages/$id",
  component: EditFixedPage,
});

const deployTokensRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/deploy-tokens",
  component: DeployTokensPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  enrollRoute,
  signedInRoute.addChildren([
    homeRoute,
    fixedPagesRoute,
    newFixedPageRoute,
    editFixedPageRoute,
    securityRoute,
    deployTokensRoute,
  ]),
]);

/** 管理画面を組み立てるときに渡す値。 */
export type AppDependencies = Omit<RouterContext, "queryClient"> & {
  /** 画面の履歴。 */
  readonly history: RouterHistory;
};

const createAppRouter = ({
  history,
  ...context
}: AppDependencies & Pick<RouterContext, "queryClient">) =>
  createRouter({ routeTree, history, context });

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

  const router = createAppRouter({ ...dependencies, queryClient });

  return { router, queryClient };
};

declare module "@tanstack/react-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- TanStack Router の型の登録は、interface の宣言のマージでしか書けない
  interface Register {
    /** 管理画面の router。 */
    router: AppRouter;
  }
}
