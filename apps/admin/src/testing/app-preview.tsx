import { type ReactNode, use, useState } from "react";

import { App } from "../app";
import type { Authenticator } from "../features/auth/webauthn/create-authenticator";
import { LocaleContext } from "../i18n/locale-context";
import type { FakeRoutes } from "./create-fake-api";
import { createTestApp } from "./create-test-app";

/** `AppPreview` に渡す値。 */
type AppPreviewProps = {
  /** 最初に開くパス。 */
  readonly path: string;
  /** 作り物の server の応答を作る関数(描くたびに、新しい状態で始める)。 */
  readonly createRoutes: () => FakeRoutes;
  /** 作り物の認証器。 */
  readonly authenticator?: Authenticator;
};

/** 作り物の server と認証器につないだ管理画面を、story の言語で描く。 */
export const AppPreview = ({
  path,
  createRoutes,
  authenticator,
}: AppPreviewProps): ReactNode => {
  const locale = use(LocaleContext);
  const [{ router, queryClient }] = useState(() =>
    createTestApp({
      path,
      routes: createRoutes(),
      ...(authenticator === undefined ? {} : { authenticator }),
    }),
  );

  return <App locale={locale} queryClient={queryClient} router={router} />;
};
