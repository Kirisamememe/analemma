import {
  type NavigateOptions,
  type ToOptions,
  useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";
import { useTranslation } from "react-i18next";

declare module "react-aria-components" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- React Aria Components の型の登録は、interface の宣言のマージでしか書けない
  interface RouterConfig {
    /** リンクの行き先。 */
    href: NonNullable<ToOptions["to"]>;
    /** 移るときの options。 */
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

/** `UiProvider` に渡す値。 */
type UiProviderProps = {
  /** 管理画面の中身。 */
  readonly children: ReactNode;
};

/** 部品に、i18next の言語と TanStack Router の navigate を渡す Provider。 */
export const UiProvider = ({ children }: UiProviderProps): ReactNode => {
  const router = useRouter();
  const { i18n } = useTranslation();

  return (
    <RouterProvider
      navigate={(to, options) => {
        void router.navigate({ ...options, to });
      }}
      useHref={(to) => router.buildLocation({ to }).href}
    >
      <I18nProvider locale={i18n.language}>{children}</I18nProvider>
    </RouterProvider>
  );
};
