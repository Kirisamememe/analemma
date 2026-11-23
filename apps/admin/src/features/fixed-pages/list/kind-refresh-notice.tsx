import type { ReactNode } from "react";

import type { QueryRetry } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

const restoreAfterRetry = (notice: HTMLDivElement | null) => {
  if (notice === null) return;

  const parent = notice.parentElement;

  return () => {
    if (!notice.contains(document.activeElement)) return;

    queueMicrotask(() => {
      if (
        parent?.isConnected !== true ||
        document.activeElement !== document.body
      ) {
        return;
      }

      const target =
        parent.querySelector<HTMLElement>(
          'input:not([type="hidden"]), button:not(:disabled)',
        ) ?? parent.querySelector<HTMLElement>("h2");

      if (target?.matches("h2") === true) target.tabIndex = -1;

      target?.focus();
    });
  };
};

/** 前に取得した種類を表示しながら、一覧の更新をやり直す知らせ。 */
export const KindRefreshNotice = ({
  refreshFailure,
  source,
}: Record<"refreshFailure", QueryRetry> &
  Record<"source", "list" | "definition">): ReactNode => {
  const t = useTranslate();

  return (
    <div ref={restoreAfterRetry}>
      <Notice tone="warning">
        <Cluster align="center" gap={2} justify="between">
          <Text>
            {t(
              source === "list"
                ? "fixedPageEditor.kindsRefreshFailed"
                : "fixedPageEditor.kindRefreshFailed",
            )}
          </Text>
          <Button
            isPending={refreshFailure.isRetrying}
            onPress={refreshFailure.retry}
          >
            {t("fixedPageEditor.reloadKinds")}
          </Button>
        </Cluster>
      </Notice>
    </div>
  );
};
