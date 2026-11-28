import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { toRegionalLocale } from "@/i18n/locales";
import { UiProvider } from "@/ui/primitives/ui-provider";

/** 部品につなぐ Provider に渡す値。 */
type ConnectedUiProviderProps = {
  /** 管理画面の中身。 */
  children: ReactNode;
};

/** 部品に、i18next の今の言語と、TanStack Router での移動をつなぐ Provider。 */
export const ConnectedUiProvider = ({
  children,
}: ConnectedUiProviderProps): ReactNode => {
  const router = useRouter();
  const { i18n, t } = useTranslation();

  return (
    <UiProvider
      locale={toRegionalLocale(i18n.language)}
      navigate={(href) => {
        void router.navigate({ href });
      }}
      toastCloseLabel={t("ui.close")}
    >
      {children}
    </UiProvider>
  );
};
