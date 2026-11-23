import { useRef, useState } from "react";

import { fixedPageSlug, fixedPageTitle } from "@analemma/contract";

import {
  clearChangedErrors,
  type EditorErrors,
  refusedSaveErrors,
} from "./editor-errors";
import { fixedPageQueryKey, type LoadedFixedPage } from "./fixed-page-query";
import { createEditorValues, type EditorValues } from "./flat-content";
import { hasUnsavedChanges, saveFixedPage } from "./save-fixed-page";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useLeaveConfirmation } from "@/api/leave-confirmation";
import { useApiMutation, useApiCache } from "@/api/server-state/server-state";
import { useAppForm } from "@/components/forms";
import { FIXED_PAGES_QUERY_KEY } from "@/features/fixed-pages/list/fixed-pages-query";
import { useTranslate } from "@/i18n/use-translate";
import { useShowToast } from "@/ui/primitives/overlays";

type Page = ApiOutputs["admin"]["fixedPages"]["get"];
/** 固定ページのフォームに渡す値。 */
export type FixedPageEditorProps = {
  /** 種類の定義。 */
  kind: ApiOutputs["admin"]["kinds"]["get"];
  /** 保存できたときに呼ぶ関数。 */
  onSaved: (page: Page) => void;
} & (
  | {
      /** 編集する固定ページ(作成では無し)。 */
      page?: undefined;
      /** 削除できたときに呼ぶ関数(作成では無し)。 */
      onDeleted?: undefined;
    }
  | {
      /** 編集する固定ページ。 */
      page: Page;
      /** 削除できたときに呼ぶ関数。 */
      onDeleted: () => void;
    }
);
const SCHEMAS = { slug: fixedPageSlug, title: fixedPageTitle };

const focusError = (root: HTMLElement | null, names: readonly string[]) => {
  const targets = root?.querySelectorAll<HTMLElement>("[data-field]");
  const target = Array.from(targets ?? []).find((element) =>
    names.includes(element.dataset["field"] ?? ""),
  );

  if (target instanceof HTMLFieldSetElement) target.focus();
  else {
    target
      ?.querySelector<HTMLElement>(
        "input:not([type=hidden]),textarea,[role=spinbutton],button",
      )
      ?.focus();
  }
};

/** 固定ページの入力と保存の状態と、保存していない変更を残して離れるときの確かめを持つ。 */
export const useEditorForm = ({
  kind,
  page,
  onSaved,
}: FixedPageEditorProps) => {
  const t = useTranslate();
  const { api } = useAppContext();
  const toast = useShowToast();
  const { refresh, replace } = useApiCache();
  const root = useRef<HTMLDivElement>(null);
  const [{ values: initial, ...base }] = useState(() =>
    createEditorValues(kind.fields, page),
  );
  const saved = useRef(initial); // 開いたときの値か、最後に保存できた値
  const submitted = useRef(initial);
  const [errors, setErrors] = useState<EditorErrors>({ fields: {} });

  const saving = useApiMutation({
    send: async (values: EditorValues) => ({
      values,
      result: await saveFixedPage(api, {
        ...base,
        target: page === undefined ? { kind: kind.name } : { id: page.id },
        values,
      }),
    }),
    onSuccess: async ({ values, result }) => {
      if (result._tag === "Succeeded") {
        const isOpen = root.current !== null;

        saved.current = values;

        if (isOpen) {
          toast({
            tone: "success",
            message: t(
              page === undefined
                ? "fixedPageEditor.created"
                : "fixedPageEditor.saved",
            ),
          });
          onSaved(result.data);
        }

        if (isOpen && page !== undefined) {
          await replace(fixedPageQueryKey(page.id), {
            _tag: "Succeeded",
            data: result.data,
          } satisfies LoadedFixedPage);
        }

        await refresh(FIXED_PAGES_QUERY_KEY);

        return;
      }

      const next = refusedSaveErrors(result, t);
      const names = Object.keys(next.fields);

      setErrors(next);
      requestAnimationFrame(() => {
        focusError(root.current, names);
      });
    },
    onError: () => {
      toast({ tone: "danger", message: t("fixedPageEditor.saveFailed") });
    },
  });
  const form = useAppForm({
    defaultValues: initial,
    canSubmitWhenInvalid: true,
    onSubmit: ({ value }) => {
      setErrors({ fields: {} });
      submitted.current = value;
      saving.mutate(value);
    },
    onSubmitInvalid: ({ formApi }) => {
      const invalid = (["slug", "title"] as const).filter(
        (key) => (formApi.getFieldMeta(key)?.errors.length ?? 0) > 0,
      );
      requestAnimationFrame(() => {
        focusError(root.current, invalid);
      });
    },
  });
  const leaving = useLeaveConfirmation(() => {
    const current = form.state.values;

    return (
      hasUnsavedChanges(base, { saved: saved.current, current }) ||
      (saving.isPending &&
        hasUnsavedChanges(base, { saved: submitted.current, current }))
    );
  });
  const check =
    (key: "slug" | "title") =>
    ({ value }: Record<"value", string>) =>
      SCHEMAS[key].safeParse(value).success
        ? undefined
        : t(
            key === "slug"
              ? "fixedPageEditor.invalidSlug"
              : "fixedPageEditor.invalidTitle",
          );
  const changed = (name: string) => {
    setErrors((previous) => clearChangedErrors(previous, name));
  };

  return {
    form,
    fields: base.fields,
    errors,
    changed,
    check,
    root,
    saving,
    leaving,
  };
};

/** 固定ページの各項目が使うフォーム。 */
export type EditorForm = ReturnType<typeof useEditorForm>["form"];
