import type { ReactNode } from "react";

import type { QueryRetry } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** 前に取得した種類を表示しながら、一覧の更新をやり直す知らせ。 */
export const KindsRefreshNotice = ({
  refreshFailure,
}: Record<"refreshFailure", QueryRetry>): ReactNode => {
  const t = useTranslate();

  return (
    <Notice tone="warning">
      <Cluster align="center" gap={2} justify="between">
        <Text>{t("fixedPageEditor.kindsRefreshFailed")}</Text>
        <Button
          isPending={refreshFailure.isRetrying}
          onPress={refreshFailure.retry}
        >
          {t("fixedPageEditor.reloadKinds")}
        </Button>
      </Cluster>
    </Notice>
  );
};
