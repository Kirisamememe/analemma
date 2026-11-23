import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const ROWS = [0, 1, 2] as const;

const loading = tv({
  slots: {
    base: "flex loading-state-animation flex-col gap-4",
    row: "flex items-center justify-between gap-4",
    lines: "flex min-w-0 grow flex-col gap-0.5",
    field: "flex flex-col gap-1.5",
  },
});

/** 読み込み中の欄に渡す値。 */
type LoadingStateProps = {
  /** 読み込む中身の形。 */
  layout: "list" | "form";
};

/** 中身の形をなぞる骨組みで、読み込んでいることを伝える欄。 */
export const LoadingState = ({ layout }: LoadingStateProps): ReactNode => {
  const { t } = useTranslation();
  const { base, row, lines, field } = loading();

  return (
    <output className={base()}>
      <span className="sr-only">{t("ui.loading")}</span>
      {ROWS.map((index) =>
        layout === "list" ? (
          <span className={row()} key={index}>
            <span className={lines()}>
              <Skeleton shape="text" width="md" />
              <Skeleton shape="caption" width="lg" />
            </span>
            <Skeleton shape="control-sm" width="xs" />
          </span>
        ) : (
          <span className={field()} key={index}>
            <Skeleton shape="text" width="sm" />
            <Skeleton shape="control" width="full" />
          </span>
        ),
      )}
    </output>
  );
};
