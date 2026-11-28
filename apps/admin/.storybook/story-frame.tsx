import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";

import { useHtmlPreferences } from "./use-html-preferences";

import { ConnectedUiProvider } from "@/app/connected-ui-provider";
import { createI18n } from "@/i18n/create-i18n";
import type { Locale } from "@/i18n/locales";
import type { Theme } from "@/preferences/theme";

const createStoryRouter = () =>
  createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

/** `StoryFrame` に渡す値。 */
type StoryFrameProps = {
  /** 訳と部品が使う言語。 */
  locale: Locale;
  /** story に見える文の言語(訳でない見本の文のとき)。 */
  contentLang: string | undefined;
  /** 配色。 */
  theme: Exclude<Theme, "system">;
  /** story の中身。 */
  children: ReactNode;
};

/** story を、管理画面と同じ言語・配色・router の中で描く枠。 */
export const StoryFrame = ({
  locale,
  contentLang = locale,
  theme,
  children,
}: StoryFrameProps): ReactNode => {
  const [router] = useState(createStoryRouter);
  const i18n = useMemo(() => createI18n(locale), [locale]);
  useHtmlPreferences(contentLang, theme);

  return (
    <I18nextProvider i18n={i18n}>
      <RouterContextProvider router={router}>
        <ConnectedUiProvider>{children}</ConnectedUiProvider>
      </RouterContextProvider>
    </I18nextProvider>
  );
};
