import { useCallback, useReducer, useRef } from "react";

import {
  seriesChangeResult,
  seriesDetailReducer,
} from "../logic/series-detail";
import { seriesMutationScope } from "../logic/series-mutation-scope";
import {
  changeSeries,
  type SeriesChange,
  SERIES_LIST_KEY,
  seriesKey,
  seriesSaveKey,
  type Series,
} from "../queries/series-query";

import { useAppContext } from "@/api/app-context";
import {
  useApiCache,
  useApiMutation,
  useIsApiMutationPending,
} from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

/** シリーズへの操作を送り、結果を表示中の詳細と一覧へ反映する。 */
export const useSeriesDetail = (
  { id, name }: Pick<Series, "id" | "name">,
  onDeleted: () => void,
) => {
  const { api } = useAppContext();
  const { refresh } = useApiCache();
  const { close: closeFailure, show: showFailure } = useFailureToast();
  const toast = useShowToast();
  const t = useTranslate();
  const [state, dispatch] = useReducer(seriesDetailReducer, {});
  const latest = useRef<SeriesChange>(undefined);
  const isSaving = useIsApiMutationPending(seriesSaveKey(id));

  const refreshSeries = () =>
    Promise.all([
      refresh(SERIES_LIST_KEY, "active"),
      refresh(seriesKey(id), "active"),
    ]);

  const { mutate, isPending } = useApiMutation({
    scope: seriesMutationScope(id),
    send: (change: SeriesChange) => changeSeries(api, { ...change, id }),
    onSuccess: async (code, change) => {
      const result = seriesChangeResult(change, code);

      if (
        latest.current === change &&
        result.kind === "changed" &&
        result.deleted
      ) {
        onDeleted();
      }

      await refreshSeries();

      if (latest.current !== change) return;

      if (result.kind === "failed") {
        dispatch({ type: "failed", change });
        showFailure(t(result.message));
      } else {
        dispatch({ type: "changed", change });
        toast({
          tone: "success",
          message: t(result.message, { title: name }),
        });
      }
    },
    onError: (change) => {
      void refreshSeries();

      if (latest.current !== change) return;

      dispatch({ type: "failed", change });
      showFailure(t("series.changeFailed"));
    },
  });

  const change = useCallback(
    (input: SeriesChange) => {
      closeFailure();
      latest.current = input;
      dispatch({ type: "sent", change: input });
      mutate(input);
    },
    [closeFailure, mutate],
  );

  return {
    dialog: state.dialog,
    pending: state.pending,
    isPending,
    isSaving,
    change,
    openDialog: (dialog: "edit" | "delete") => {
      dispatch({ type: "dialog", dialog });
    },
    closeDialog: () => {
      closeFailure();
      dispatch({ type: "dialog" });
    },
  };
};
