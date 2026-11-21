import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useTranslation } from "../i18n/use-translation";

/** 無いパスを開いたときの画面。 */
export const NotFoundPage = (): ReactNode => {
  const t = useTranslation();
  const { pathname } = useLocation();

  return (
    <>
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.description", { path: pathname })}</p>
      <Link to="/">{t("notFound.backHome")}</Link>
    </>
  );
};
