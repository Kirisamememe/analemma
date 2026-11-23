import {
  type NavigateOptions,
  type ToOptions,
  useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { type Locale, toLocale } from "@/i18n/locales";
import { ToastProvider } from "@/ui/primitives/overlays";

type WithParams<Path extends string> =
  Path extends `${infer Head}$${string}/${infer Tail}`
    ? `${Head}${string}/${WithParams<Tail>}`
    : Path extends `${infer Head}$${string}`
      ? `${Head}${string}`
      : Path;

/** 管理画面の route のパス(`$id` などは値を入れる前の形)。 */
export type RoutePath = NonNullable<ToOptions["to"]>;

/** 管理画面の中の行き先(route のパスか、その `$id` などに値を入れたもの)。 */
export type AppHref = WithParams<RoutePath>;

declare module "react-aria-components" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- React Aria Components の型の登録は、interface の宣言のマージでしか書けない
  interface RouterConfig {
    /** リンクの行き先。 */
    href: AppHref;
    /** 移るときの options。 */
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

/** React Aria Components の辞書を引く言語(辞書は地域ごとにある)。 */
const ARIA_LOCALES: Readonly<Record<Locale, string>> = {
  en: "en-US",
  ja: "ja-JP",
  "zh-Hans": "zh-CN",
};

/** `UiProvider` に渡す値。 */
type UiProviderProps = {
  /** 管理画面の中身。 */
  children: ReactNode;
};

/** 部品に、i18next の言語と TanStack Router の navigate を渡す Provider。 */
export const UiProvider = ({ children }: UiProviderProps): ReactNode => {
  const router = useRouter();
  const { i18n } = useTranslation();

  return (
    <RouterProvider
      navigate={(href, options) => {
        void router.navigate({ ...options, href });
      }}
    >
      <I18nProvider locale={ARIA_LOCALES[toLocale(i18n.language)]}>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </RouterProvider>
  );
};
