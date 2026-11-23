import type { ReactNode } from "react";
import { ProgressBar } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { tv } from "@/ui/tv";

const progress = tv({
  slots: {
    track: [
      "pointer-events-none fixed inset-x-0 top-0 z-toast h-0.5",
      "navigation-progress-animation overflow-hidden",
    ],
    indicator:
      "h-full navigation-progress-indicator-animation rounded-full bg-primary",
  },
});

/** 遷移の進み具合の帯に渡す値。 */
type NavigationProgressProps = {
  /** 読み込んでいるか。 */
  isActive: boolean;
};

/** 読み込んでいる間、画面の上端に流す帯。 */
export const NavigationProgress = ({
  isActive,
}: NavigationProgressProps): ReactNode => {
  const { t } = useTranslation();
  const { track, indicator } = progress();

  return (
    <>
      {isActive && (
        <ProgressBar
          aria-label={t("ui.loading")}
          className="sr-only"
          isIndeterminate
        />
      )}
      <div
        aria-hidden="true"
        className={track()}
        data-active={isActive || undefined} // 消えるときは、少し待ってから薄くする
      >
        <div className={indicator()} />
      </div>
    </>
  );
};
