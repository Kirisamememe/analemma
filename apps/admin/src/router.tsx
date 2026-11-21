import {
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router";

import { HomePage } from "./routes/home-page";
import { NotFoundPage } from "./routes/not-found-page";
import { RootLayout } from "./routes/root-layout";

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([homeRoute]);

/** 履歴を受け取り、管理画面の router を作る。 */
export const createAppRouter = (history: RouterHistory) =>
  createRouter({ routeTree, history });

declare module "@tanstack/react-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- TanStack Router の型の登録は、interface の宣言のマージでしか書けない
  interface Register {
    /** 管理画面の router。 */
    router: ReturnType<typeof createAppRouter>;
  }
}
