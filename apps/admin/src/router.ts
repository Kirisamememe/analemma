import {
  createRootRoute,
  createRoute,
  createRouter,
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

/** 管理画面の route の木。 */
export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute]),
});

declare module "@tanstack/react-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- TanStack Router の型の登録は、interface の宣言のマージでしか書けない
  interface Register {
    /** 管理画面の route の木。 */
    router: typeof router;
  }
}
