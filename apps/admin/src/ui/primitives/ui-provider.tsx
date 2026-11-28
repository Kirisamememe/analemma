import type { ComponentProps, ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";

import { ToastProvider } from "@/ui/primitives/overlays";

/** `UiProvider` に渡す値。 */
type UiProviderProps = {
  /** 部品が持つ文言と、日付や数の並びを決める、地域を付けた言語。 */
  locale: string;
  /** 部品のリンクが、行き先へ移るときに呼ぶ関数。 */
  navigate: ComponentProps<typeof RouterProvider>["navigate"];
  /** 中身。 */
  children: ReactNode;
};

/** 部品に、言語と、行き先へ移る関数を渡す Provider。 */
export const UiProvider = ({
  locale,
  navigate,
  children,
}: UiProviderProps): ReactNode => (
  <RouterProvider navigate={navigate}>
    <I18nProvider locale={locale}>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  </RouterProvider>
);
