import {
  type NavigateOptions,
  type ToOptions,
  useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";

import type { Locale } from "../../i18n/locales";

declare module "react-aria-components" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- React Aria Components の型の登録は、interface の宣言のマージでしか書けない
  interface RouterConfig {
    /** リンクの行き先。 */
    href: NonNullable<ToOptions["to"]>;
    /** 移るときの options。 */
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

/** 部品の言語と移り方を決める箱に渡す値。 */
type UiProviderProps = {
  /** 部品が使う言語(日付や数の書き方)。 */
  readonly locale: Locale;
  /** 管理画面の中身。 */
  readonly children: ReactNode;
};

/** React Aria Components に、画面の言語と TanStack Router での移り方を渡す箱。 */
export const UiProvider = ({
  locale,
  children,
}: UiProviderProps): ReactNode => {
  const router = useRouter();

  return (
    <RouterProvider
      navigate={(to, options) => {
        void router.navigate({ ...options, to });
      }}
      useHref={(to) => router.buildLocation({ to }).href}
    >
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </RouterProvider>
  );
};
