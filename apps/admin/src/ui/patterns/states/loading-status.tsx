import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useLoadingAnnouncement } from "@/ui/patterns/states/hooks/use-loading-announcement";

/** 読み込み中の通知に渡す値。 */
type LoadingStatusProps = {
  /** 読み込んでいる内容を伝える文言。 */
  label?: string | undefined;
};

/** 読み込み中であることを伝える通知欄。 */
export const LoadingStatus = ({ label }: LoadingStatusProps): ReactNode => {
  const { t } = useTranslation();
  const ready = useLoadingAnnouncement();

  return (
    <output className="sr-only forced-colors:not-sr-only">
      {ready && (label ?? t("ui.loading"))}
    </output>
  );
};
