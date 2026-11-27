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
import { FIXED_PAGE_KINDS_KEY } from "@/features/fixed-pages/queries/fixed-pages-query";
import { IMAGES_QUERY_KEY } from "@/queries/images-query";
import { EnrollPage } from "@/routes/auth/enroll-page";
import { LoginPage } from "@/routes/auth/login-page";
import { DeployTokensPage } from "@/routes/deploy-tokens/deploy-tokens-page";
import {
  EditFixedPage,
  NewFixedPage,
} from "@/routes/fixed-pages/fixed-page-routes";
import { FixedPagesPage } from "@/routes/fixed-pages/fixed-pages-page";
import { HomePage } from "@/routes/home-page";
import { ImageViewerPage } from "@/routes/images/image-viewer-page";
import { ImagesPage } from "@/routes/images/images-page";
import { RootLayout } from "@/routes/layout/root-layout";
import { SignedInLayout } from "@/routes/layout/signed-in-layout";
import { NotFoundPage } from "@/routes/not-found-page";
import { SecurityPage } from "@/routes/security-page";
import { SessionErrorPage } from "@/routes/session-error-page";

/** 画面が使う、server と認証器の窓口。 */
export type AppContext = {
  /** server の API。 */
  readonly api: ApiClient;
  /** パスキーの認証器。 */
  readonly authenticator: Authenticator;
  /** ログインの最中に、管理用 API を送らせない gate。 */
  readonly gate: AuthGate;
};

/** route が受け取る値。 */
type RouterContext = AppContext & {
  /** server の状態を持つ query client。 */
  readonly queryClient: QueryClient;
  /** 画像一覧で開いた写真と、開く前のスクロール位置。 */
  readonly imageListPosition: {
    /** 一覧に戻ったときの表示位置。 */
    current?: {
      /** 開いた写真へのリンク。 */
      href: string;
      /** 開く前の縦方向のスクロール位置。 */
      top: number;
    };
  };
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

/** セッションを確かめる route が受け取る値。 */
type SessionCheck = {
  /** route の context。 */
  readonly context: RouterContext;
};

const checkSession = ({
  context: { api, queryClient },
}: SessionCheck): void => {
  void queryClient
    .query({
      queryKey: ["admin", "session", crypto.randomUUID()],
      queryFn: () => api.admin.session.get(),
      retry: false,
    })
    .catch(() => undefined); // 401 は query client がログインの画面へ移す
};

const signedInRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "signed-in",
  component: SignedInLayout,
  errorComponent: SessionErrorPage,
  beforeLoad: checkSession,
});

const homeRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/",
  component: HomePage,
});

const fixedPagesTab = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/fixed-pages",
  onLeave: ({ context }) => {
    context.queryClient.removeQueries({ queryKey: FIXED_PAGE_KINDS_KEY });
  },
});

const fixedPagesRoute = createRoute({
  getParentRoute: () => fixedPagesTab,
  path: "/",
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
  getParentRoute: () => fixedPagesTab,
  path: "new",
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
  getParentRoute: () => fixedPagesTab,
  path: "$id",
  component: EditFixedPage,
});

const imagesRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/images",
  component: ImagesPage,
});

const imageViewerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/images/$id",
  component: ImageViewerPage,
  errorComponent: SessionErrorPage,
  beforeLoad: checkSession, // 写真を大きく見せるため、ナビの骨組みの外に置く
});

const deployTokensRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/deploy-tokens",
  component: DeployTokensPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  enrollRoute,
  imageViewerRoute,
  signedInRoute.addChildren([
    homeRoute,
    fixedPagesTab.addChildren([
      fixedPagesRoute,
      newFixedPageRoute,
      editFixedPageRoute,
    ]),
    imagesRoute,
    securityRoute,
    deployTokensRoute,
  ]),
]);

/** 管理画面を組み立てるときに渡す値。 */
export type AppDependencies = AppContext & {
  /** 画面の履歴。 */
  readonly history: RouterHistory;
};

const createAppRouter = ({
  history,
  ...context
}: AppDependencies &
  Pick<RouterContext, "queryClient" | "imageListPosition">) =>
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

const imagePath = (pathname: string): string =>
  pathname.toLowerCase().replace(/\/+$/v, "");

const inImages = (pathname: string): boolean =>
  pathname === "/images" || pathname.startsWith("/images/");

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
        replace: true, // 「戻る」で、セッションの切れた画面に戻らない
      });
    },
  });

  const imageListPosition: RouterContext["imageListPosition"] = {};

  const router = createAppRouter({
    ...dependencies,
    queryClient,
    imageListPosition,
  });

  queryClient.setQueryDefaults(IMAGES_QUERY_KEY, {
    staleTime: Infinity,
    refetchOnMount: (query) =>
      query.state.status !== "error" ||
      query.state.fetchMeta?.fetchMore?.direction !== "forward",
    gcTime: Infinity,
  });
  router.subscribe("onBeforeNavigate", ({ fromLocation, toLocation }) => {
    const target = imagePath(toLocation.pathname);

    if (
      fromLocation !== undefined &&
      imagePath(fromLocation.pathname) === "/images" &&
      target.startsWith("/images/")
    ) {
      imageListPosition.current = {
        href: target,
        top: window.scrollY,
      };
    }
  });
  router.subscribe("onResolved", ({ fromLocation, toLocation }) => {
    if (
      fromLocation !== undefined &&
      inImages(imagePath(fromLocation.pathname)) &&
      !inImages(imagePath(toLocation.pathname))
    ) {
      delete imageListPosition.current;
      queryClient.removeQueries({ queryKey: IMAGES_QUERY_KEY, exact: true });
    }
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
