import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { RouteProgress } from "./route-progress";

import { UiProvider } from "@/ui/primitives/ui-provider";

/** すべての画面に UI の Provider を渡し、読み込みの間は上端に帯を流す。 */
export const RootLayout = (): ReactNode => (
  <UiProvider>
    <RouteProgress />
    <Outlet />
  </UiProvider>
);
