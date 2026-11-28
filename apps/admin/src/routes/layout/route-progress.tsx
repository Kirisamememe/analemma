import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useIsLoadingFirstData } from "@/api/server-state/pending-state";
import { NavigationProgress } from "@/ui/primitives/navigation";

/** 画面を移る間と、最初のデータを読み込む間、上端に帯を流す。 */
export const RouteProgress = (): ReactNode => {
  const isRouting = useRouterState({ select: (state) => state.isLoading });
  const isLoadingData = useIsLoadingFirstData();
  const { t } = useTranslation();

  return (
    <NavigationProgress
      isActive={isRouting || isLoadingData}
      label={t("ui.loading")}
    />
  );
};
