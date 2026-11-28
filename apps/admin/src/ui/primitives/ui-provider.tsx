import type { ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";

import { ToastProvider } from "@/ui/primitives/overlays";

/** `UiProvider` に渡す値。 */
type UiProviderProps = {
  /** React Aria Components の内蔵の文言と、日付や数の並びを決める、地域を付けた言語。 */
  locale: string;
  /** 部品のリンクが、行き先へ移るときに呼ぶ関数。 */
  navigate: (href: string) => void;
  /** 知らせ(Toast)を閉じるボタンの、アクセシブルな名前。 */
  toastCloseLabel: string;
  /** 中身。 */
  children: ReactNode;
};

/** 部品に、言語・行き先へ移る関数・知らせを閉じるボタンの名前を渡す Provider。 */
export const UiProvider = ({
  locale,
  navigate,
  toastCloseLabel,
  children,
}: UiProviderProps): ReactNode => (
  <RouterProvider navigate={navigate}>
    <I18nProvider locale={locale}>
      <ToastProvider closeLabel={toastCloseLabel}>{children}</ToastProvider>
    </I18nProvider>
  </RouterProvider>
);
