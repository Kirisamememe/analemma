import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** すべての画面を包む骨組み。 */
export const RootLayout = (): ReactNode => (
  <main>
    <Outlet />
  </main>
);
