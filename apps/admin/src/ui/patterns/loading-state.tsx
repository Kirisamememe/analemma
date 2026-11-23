import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useLoadingAnnouncement } from "@/ui/patterns/hooks/use-loading-announcement";
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

/** 読み込み中の通知に渡す値。 */
type LoadingStatusProps = {
  /** 読み込んでいる内容を伝える文言。 */
  label?: string;
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

/** 読み込み中の欄に渡す値。 */
type LoadingStateProps =
  | {
      /** 読み込む中身の形。 */
      layout: "list" | "form";
    }
  | {
      /** 画面の形に合わせた骨組み。 */
      layout: "custom";
      /** 読み込んでいる内容を伝える文言。 */
      label: string;
      /** 読み込み中に表示する骨組み。 */
      children: ReactNode;
    };

/** 中身の形をなぞる骨組みで、読み込んでいることを伝える欄。 */
export const LoadingState = (props: LoadingStateProps): ReactNode => {
  const { base, row, lines, field } = loading();

  if (props.layout === "custom") {
    return (
      <div className={base()}>
        <LoadingStatus label={props.label} />
        {props.children}
      </div>
    );
  }

  return (
    <div className={base()}>
      <LoadingStatus />
      {ROWS.map((index) =>
        props.layout === "list" ? (
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
    </div>
  );
};
