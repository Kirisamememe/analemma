import {
  createMemoryHistory,
  type RouterHistory,
} from "@tanstack/react-router";

import { createApiClient } from "@/api/create-api-client";
import { type AppParts, createApp } from "@/app";
import {
  createAuthGate,
  gateAdminRequests,
} from "@/features/auth/create-auth-gate";
import type { Authenticator } from "@/features/auth/webauthn";
import { type FakeRoutes, createFakeApi } from "@/testing/create-fake-api";

/** 組み立てる管理画面の条件。 */
export type TestAppOptions = {
  /** 最初に開くパス。 */
  readonly path: string;
  /** 作り物の server の応答。 */
  readonly routes: FakeRoutes;
  /** 作り物の認証器。 */
  readonly authenticator?: Authenticator;
};

/** 組み立てた管理画面と、確かめるためのもの。 */
export type TestApp = AppParts & {
  /** 画面の履歴。 */
  readonly history: RouterHistory;
  /** 呼ばれた procedure のパスの並び。 */
  readonly calls: readonly string[];
};

const NO_AUTHENTICATOR: Authenticator = {
  authenticate: () => Promise.resolve({ _tag: "Cancelled" }),
  register: () => Promise.resolve({ _tag: "Cancelled" }),
};

/** 作り物の server と認証器につないだ、管理画面の router と query client を作る。 */
export const createTestApp = ({
  path,
  routes,
  authenticator = NO_AUTHENTICATOR,
}: TestAppOptions): TestApp => {
  const history = createMemoryHistory({ initialEntries: [path] });
  const { calls, fetch } = createFakeApi(routes);
  const gate = createAuthGate();
  const api = createApiClient({
    origin: "http://localhost:5173",
    fetch: gateAdminRequests(gate, fetch),
  });

  return {
    ...createApp({ history, api, authenticator, gate }),
    history,
    calls,
  };
};
