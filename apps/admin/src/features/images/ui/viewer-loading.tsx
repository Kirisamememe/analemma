import type { ReactNode } from "react";

import { viewerStyle as style } from "./viewer-styles";

import { useTranslate } from "@/i18n/use-translate";
import { LoadingStatus } from "@/ui/patterns";
import { Skeleton } from "@/ui/primitives/graphics";

/** 写真と情報を取得している間の表示。 */
export const ViewerLoading = (): ReactNode => {
  const t = useTranslate();

  return (
    <>
      <LoadingStatus label={t("imageDetail.loading")} />
      <div
        aria-hidden="true"
        className={style.body({ className: "loading-state-animation" })}
      >
        <div className={style.stage()}>
          <span className={style.placeholder()} />
        </div>
        <div className={style.panel()}>
          <Skeleton shape="text" width="lg" />
          <Skeleton shape="caption" width="sm" />
          <Skeleton shape="text" width="md" />
          <Skeleton shape="caption" width="lg" />
        </div>
      </div>
    </>
  );
};
