import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { App } from "../app";
import type { Authenticator } from "../features/auth/webauthn/create-authenticator";
import type { FakeRoutes } from "./create-fake-api";
import { createTestApp } from "./create-test-app";

/** `AppPreview` に渡す値。 */
type AppPreviewProps = {
  /** 最初に開くパス。 */
  readonly path: string;
  /** 作り物の server の応答を作る関数(story を開いたときに1回だけ呼ぶ)。 */
  readonly createRoutes: () => FakeRoutes;
  /** 作り物の認証器。 */
  readonly authenticator?: Authenticator;
};

/** 作り物の server と認証器につないだ管理画面を、story の i18next の instance で描く。 */
export const AppPreview = ({
  path,
  createRoutes,
  authenticator,
}: AppPreviewProps): ReactNode => {
  const { i18n } = useTranslation();
  const [{ router, queryClient }] = useState(() =>
    createTestApp({
      path,
      routes: createRoutes(),
      ...(authenticator === undefined ? {} : { authenticator }),
    }),
  );

  return <App i18n={i18n} queryClient={queryClient} router={router} />;
};
