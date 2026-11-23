import type { ReactNode } from "react";

import { useTranslate } from "@/i18n/use-translate";
import { LoadingState } from "@/ui/patterns";

/** 写真と情報を取得している間の表示。 */
export const ViewerLoading = (): ReactNode => {
  const t = useTranslate();
  return <LoadingState layout="media" label={t("imageDetail.loading")} />;
};
