import { useCallback, useReducer, useRef } from "react";

import {
  seriesChangeResult,
  seriesDetailReducer,
  seriesPendingOrder,
} from "../logic/series-detail";
import { seriesMutationScope } from "../logic/series-mutation-scope";
import {
  changeSeries,
  missingSeriesImages,
  type SeriesChange,
} from "../queries/change-series";
import {
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
import { IMAGE_PICKER_KEY } from "@/queries/images-query";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

const EMPTY_IDS: ReadonlySet<string> = new Set();

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

      if (result.kind === "checkImages") {
        const [missing] = await Promise.all([
          missingSeriesImages(api, result.imageIds),
          refresh(IMAGE_PICKER_KEY, "active"),
        ]);

        if (latest.current !== change) return;

        dispatch({ type: "failed", change, missing });

        if (missing.size > 0) showFailure(t("series.selectionChanged"));
      } else if (result.kind === "failed") {
        dispatch({ type: "failed", change });
        showFailure(t(result.message));
      } else {
        dispatch({ type: "changed", change, focusAdd: result.focusAdd });
        toast({
          tone: "success",
          message: result.withTitle
            ? t(result.message, { title: name })
            : t(result.message),
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

  const focusAdd = useCallback(
    (button: HTMLButtonElement | null) => {
      if (button !== null && !isPending && state.focusAdd === true) {
        button.focus();
        dispatch({ type: "focused" });
      }
    },
    [isPending, state.focusAdd],
  );

  return {
    dialog: state.dialog,
    missing: state.missing ?? EMPTY_IDS,
    pending: state.pending,
    order: seriesPendingOrder(state.pending),
    isPending,
    isSaving,
    focusAdd,
    change,
    openDialog: (dialog: "edit" | "delete" | "picker") => {
      dispatch({ type: "dialog", dialog });
    },
    closeDialog: () => {
      closeFailure();
      dispatch({ type: "dialog" });
    },
  };
};
