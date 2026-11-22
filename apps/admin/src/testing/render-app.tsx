import {
  createMemoryHistory,
  type RouterHistory,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { i18n as I18n } from "i18next";

import { createApiClient } from "../api/create-api-client";
import { App } from "../app";
import {
  createAuthGate,
  gateAdminRequests,
} from "../features/auth/create-auth-gate";
import type { Authenticator } from "../features/auth/webauthn/create-authenticator";
import { createI18n } from "../i18n/create-i18n";
import type { Locale } from "../i18n/locales";
import { createApp } from "../router";
import { type FakeRoutes, createFakeApi } from "./create-fake-api";

/** 描く管理画面の条件。 */
export type RenderAppOptions = {
  /** 最初に開くパス。 */
  readonly path: string;
  /** 作り物の server の応答。 */
  readonly routes: FakeRoutes;
  /** 作り物の認証器。 */
  readonly authenticator?: Authenticator;
  /** 画面の言語。 */
  readonly locale?: Locale;
};

/** 描いた管理画面と、確かめるためのもの。 */
export type RenderedApp = {
  /** 画面の履歴。 */
  readonly history: RouterHistory;
  /** 呼ばれた procedure のパスの並び。 */
  readonly calls: readonly string[];
  /** 画面の言語と訳を持つ i18next の instance。 */
  readonly i18n: I18n;
};

const NO_AUTHENTICATOR: Authenticator = {
  authenticate: () => Promise.resolve({ _tag: "Cancelled" }),
  register: () => Promise.resolve({ _tag: "Cancelled" }),
};

/** 作り物の server と認証器につないだ管理画面を、全体で描く。 */
export const renderApp = ({
  path,
  routes,
  authenticator = NO_AUTHENTICATOR,
  locale = "ja",
}: RenderAppOptions): RenderedApp => {
  const history = createMemoryHistory({ initialEntries: [path] });
  const { calls, fetch } = createFakeApi(routes);
  const gate = createAuthGate();
  const api = createApiClient({
    origin: "http://localhost:5173",
    fetch: gateAdminRequests(gate, fetch),
  });
  const { router, queryClient } = createApp({
    history,
    api,
    authenticator,
    gate,
  });

  const i18n = createI18n(locale);

  render(<App i18n={i18n} queryClient={queryClient} router={router} />);

  return { history, calls, i18n };
};
