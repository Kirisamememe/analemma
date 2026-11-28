import type { ReactNode } from "react";

import { useLoadingAnnouncement } from "@/ui/patterns/states/hooks/use-loading-announcement";

/** 読み込み中の通知に渡す値。 */
type LoadingStatusProps = {
  /** 読み込んでいる内容を伝える文言。 */
  label: string;
};

/** 読み込み中であることを伝える通知欄。 */
export const LoadingStatus = ({ label }: LoadingStatusProps): ReactNode => {
  const ready = useLoadingAnnouncement();

  return (
    <output className="sr-only forced-colors:not-sr-only">
      {ready && label}
    </output>
  );
};
