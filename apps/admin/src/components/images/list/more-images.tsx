import type { ReactNode } from "react";

import type { NextPage } from "@/api/server-state/use-api-infinite-query";
import { useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { ErrorState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";

/** 続きを読む操作に渡す値。 */
type MoreProps = {
  /** 続きのページの状態。 */
  next: NextPage;
  /** 続きを読み始めたときに呼ぶ関数。 */
  onLoad: () => void;
  /** 再試行のボタンに focus を引き継ぐ関数。 */
  retryRef: (button: HTMLButtonElement | null) => void;
};

/** 続きの画像を読む操作と、読めなかったときの知らせ。 */
export const MoreImages = ({
  next,
  onLoad,
  retryRef,
}: MoreProps): ReactNode => {
  const t = useTranslate();

  if (next._tag === "None") return null;

  if (next._tag === "Failed") {
    return (
      <ErrorState
        isRetrying={next.isRetrying}
        layout="inline"
        level={2}
        onRetry={() => {
          onLoad();
          next.retry();
        }}
        retryRef={next.isRetrying ? undefined : retryRef}
        title={t("images.moreFailed")}
      />
    );
  }

  return (
    <Stack align="center">
      <Button
        isPending={next.isLoading}
        onPress={() => {
          onLoad();
          next.load();
        }}
      >
        {t("images.loadMore")}
      </Button>
    </Stack>
  );
};
