import type { ReactNode } from "react";

import { useTranslation } from "../i18n/use-translation";

/** ログインした後に最初に開く画面。 */
export const HomePage = (): ReactNode => {
  const t = useTranslation();

  return <h1>{t("home.title")}</h1>;
};
