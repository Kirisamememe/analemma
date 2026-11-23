import { useCallback, useState } from "react";

import { seriesFormExit } from "../logic/series-form-state";
import {
  checkSeriesField,
  seriesSaveFields,
} from "../logic/series-form-values";
import {
  saveSeries,
  SERIES_LIST_KEY,
  type SeriesFields,
} from "../queries/series-query";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { useTranslate } from "@/i18n/use-translate";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

/** シリーズを作成する Dialog の引数。 */
export type SeriesFormProps = {
  /** 入力の Dialog を閉じる。 */
  onClose: () => void;
};

/** シリーズの入力欄と保存、画面を離れるときの確認をつなぐ。 */
export const useSeriesForm = ({ onClose }: SeriesFormProps) => {
  const t = useTranslate();
  const { api } = useAppContext();
  const { refresh } = useApiCache();
  const failure = useFailureToast();
  const [refused, setRefused] = useState<string>();

  const focusRefusedSlug = useCallback(
    (element: HTMLInputElement | null) => {
      if (refused === undefined || element === null) return;

      const frame = requestAnimationFrame(() => {
        element.focus();
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    },
    [refused],
  );

  const [confirmClose, setConfirmClose] = useState(false);
  const toast = useShowToast();

  const saving = useApiMutation({
    send: (fields: SeriesFields) => saveSeries(api, fields),
    onSuccess: async (result, fields) => {
      if (result._tag === "Failed") {
        setRefused(fields.slug);
        failure.show(t("series.saveFailed"));

        return;
      }

      leaving.leave();
      onClose();
      toast({ tone: "success", message: t("series.saved") });
      await refresh(SERIES_LIST_KEY, "active");
    },
    onError: () => {
      failure.show(t("series.saveFailed"));
    },
  });

  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: { name: "", slug: "", description: "" },
    onSubmit: ({ value }) => {
      failure.close();
      saving.mutate(seriesSaveFields(value));
    },
  });

  const exit = () =>
    seriesFormExit(!form.state.isDefaultValue, saving.isPending);

  const leaving = useLeaveConfirmation(() => exit().ask);

  const stay = (): void => {
    leaving.stay();
    setConfirmClose(false);
  };

  const close = (): void => {
    failure.close();
    onClose();
  };

  const requestClose = (): void => {
    if (exit().ask) setConfirmClose(true);
    else close();
  };

  const validators = (field: keyof SeriesFields) => ({
    onChange: checkAfterSubmit((value: string) => {
      const error = checkSeriesField(field, value);
      return error === undefined ? undefined : t(error);
    }),
  });

  return {
    form,
    exitDialog: exit(),
    isPending: saving.isPending,
    confirmClose: confirmClose || leaving._tag === "Asking",
    refusedErrors:
      refused === undefined ? undefined : { slug: t("series.slugTaken") },
    focusRefusedSlug,
    clearRefused: () => {
      setRefused(undefined);
    },
    validators,
    requestClose,
    stay,
    leave: () => {
      leaving.leave();
      close();
    },
  };
};
