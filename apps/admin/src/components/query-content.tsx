import type { ReactNode, Ref } from "react";

import type { ApiQueryResult } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { ErrorState, LoadingState } from "@/ui/patterns";

/** 取得の結果に合わせて出し分ける欄に渡す値。 */
type QueryContentProps<Data> = {
  /** server のデータを読んだ結果。 */
  query: ApiQueryResult<Data>;
  /** 読み込む中身の形(読み込み中の骨組みの形)。 */
  loading: "list" | "form";
  /** 読み込めなかったときに、何を読み込めなかったかを伝える見出し。 */
  failedTitle: string;
  /** 読み込めなかった欄の見出しのレベル(置く場所の見出しの次)。 */
  level: 2 | 3;
  /** 再試行後の focus を引き継ぐ ref。 */
  retryRef?: Ref<HTMLButtonElement>;
  /** 読み込めたときに描く中身。 */
  children: (data: Data) => ReactNode;
};

/** 取得の結果に合わせて、読み込み中の骨組み・読み込めなかった欄・中身のどれかを出す。 */
export const QueryContent = <Data,>({
  query,
  loading,
  failedTitle,
  retryRef,
  level,
  children,
}: QueryContentProps<Data>): ReactNode => {
  const t = useTranslate();

  if (query._tag === "Loading") {
    return <LoadingState label={t("ui.loading")} layout={loading} />;
  }

  if (query._tag === "Failed") {
    return (
      <ErrorState
        isRetrying={query.isRetrying}
        layout="inline"
        level={level}
        onRetry={query.retry}
        retryRef={retryRef}
        title={failedTitle}
      />
    );
  }

  return children(query.data);
};
