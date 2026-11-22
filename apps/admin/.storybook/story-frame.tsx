import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { type ReactNode, useLayoutEffect, useState } from "react";

import { LocaleContext } from "../src/i18n/locale-context";
import type { Locale } from "../src/i18n/locales";
import type { Theme } from "../src/preferences/theme";
import { UiProvider } from "../src/ui/primitives/ui-provider";
import { StoryStage } from "../src/ui/specimens/story-stage";

const createStoryRouter = () =>
  createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

/** `StoryFrame` に渡す値。 */
type StoryFrameProps = {
  /** 訳と部品が使う言語。 */
  readonly locale: Locale;
  /** story に見える文の言語(訳でない見本の文のとき)。 */
  readonly contentLang: string | undefined;
  /** 配色。 */
  readonly theme: Exclude<Theme, "system">;
  /** story の中身。 */
  readonly children: ReactNode;
};

/** story を、管理画面と同じ言語・配色・router の中で描く枠。 */
export const StoryFrame = ({
  locale,
  contentLang = locale,
  theme,
  children,
}: StoryFrameProps): ReactNode => {
  const [router] = useState(createStoryRouter);

  useLayoutEffect(() => {
    document.documentElement.lang = contentLang;
    document.documentElement.dataset["theme"] = theme;
  }, [contentLang, theme]);

  return (
    <LocaleContext value={locale}>
      <RouterContextProvider router={router}>
        <UiProvider locale={locale}>{children}</UiProvider>
      </RouterContextProvider>
    </LocaleContext>
  );
};

/** `Staged` に渡す値。 */
type StagedProps = {
  /** 展示用の枠の幅(無ければ枠を付けない)。 */
  readonly width: "fit" | "fill" | undefined;
  /** story の中身。 */
  readonly children: ReactNode;
};

/** story を、展示用の枠に入れて見せる部品。 */
export const Staged = ({ width, children }: StagedProps): ReactNode =>
  width === undefined ? (
    children
  ) : (
    <StoryStage width={width}>{children}</StoryStage>
  );
