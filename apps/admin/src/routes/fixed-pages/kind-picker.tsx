import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { KindRefreshNotice } from "@/features/fixed-pages/list/kind-refresh-notice";
import {
  KIND_STALE_TIME,
  KINDS_QUERY_KEY,
  loadKinds,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import { Cluster, Heading, Stack } from "@/ui/layout";
import { EmptyState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";

/** 種類を選ぶ欄に渡す値。 */
type KindPickerProps = {
  /** 種類を選んだときに呼ぶ関数。 */
  onPick: () => void;
};

/** 作る固定ページの種類を選ぶ欄。 */
export const KindPicker = ({ onPick }: KindPickerProps): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const query = useApiQuery({
    key: KINDS_QUERY_KEY,
    tabStaleTime: KIND_STALE_TIME,
    load: () => loadKinds(api),
  });

  const refreshFailure =
    query._tag === "Loaded" ? query.refreshFailure : undefined;

  return (
    <Stack gap={3}>
      {refreshFailure !== undefined && (
        <KindRefreshNotice source="list" refreshFailure={refreshFailure} />
      )}
      <QueryContent
        failedTitle={t("fixedPageEditor.kindsLoadFailed")}
        level={2}
        loading="list"
        query={query}
      >
        {({ kinds }) =>
          kinds.length === 0 ? (
            <EmptyState
              icon="file-text"
              title={t("fixedPageEditor.emptyKinds")}
            />
          ) : (
            <Stack gap={3}>
              <Heading level={2}>{t("fixedPageEditor.chooseKind")}</Heading>
              <Cluster gap={2}>
                {kinds.map((kind) => (
                  <Button
                    key={kind.name}
                    onPress={() => {
                      onPick();
                      void navigate({
                        to: "/fixed-pages/new",
                        search: { kind: kind.name },
                      });
                    }}
                  >
                    {kind.label}
                  </Button>
                ))}
              </Cluster>
            </Stack>
          )
        }
      </QueryContent>
    </Stack>
  );
};
