import { useCallback, useRef, useState } from "react";

import { fixedPageSlug, fixedPageTitle } from "@analemma/contract";

import { createEditorValues } from "../create-editor-values";
import {
  clearChangedErrors,
  type FieldErrors,
  refusedSaveErrors,
} from "../logic/editor-errors";
import type { EditorValues } from "../logic/flat-content";
import { hasUnsavedChanges } from "../logic/save-input";
import {
  fixedPageQueryKey,
  type LoadedFixedPage,
} from "../queries/fixed-page-query";
import { saveFixedPage } from "../queries/save-fixed-page";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiMutation, useApiCache } from "@/api/server-state/server-state";
import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import { useAppForm } from "@/components/forms";
import { FIXED_PAGES_QUERY_KEY } from "@/features/fixed-pages/queries/fixed-pages-query";
import { useTranslate } from "@/i18n/use-translate";
import { focusFirstInvalidField } from "@/ui/primitives/form-fields";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

type Page = ApiOutputs["admin"]["fixedPages"]["get"];
/** 固定ページのフォームに渡す値。 */
export type FixedPageEditorProps = {
  /** 種類の定義。 */
  kind: ApiOutputs["admin"]["kinds"]["get"];
  /** 保存できたときに呼ぶ関数。 */
  onSaved: (page: Page) => void;
  /** 種類を選んで開いたか(focus の行き先が無ければ slug に移す)。 */
  picked?: boolean | undefined;
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

/** 固定ページの入力と保存の状態と、保存していない変更を残して離れるときの確かめを持つ。 */
export const useEditorForm = (
  { kind, page, onSaved }: FixedPageEditorProps,
  onEditing?: (editing: boolean) => void,
) => {
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
  const sending = useRef(false);
  const failure = useFailureToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const focusOnRender = useRef<FieldErrors>(undefined);

  const attachRoot = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element;

      if (element !== null && focusOnRender.current === errors) {
        focusOnRender.current = undefined;
        focusFirstInvalidField(element);
      }
    },
    [errors],
  );

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
        finishSaving();

        return;
      }

      const refused = refusedSaveErrors(result, t);

      focusOnRender.current = refused.fields;
      setErrors(refused.fields);
      failure.show(refused.message);
      finishSaving();
    },
    onError: () => {
      failure.show(t("fixedPageEditor.saveFailed"));
      finishSaving();
    },
  });

  const form = useAppForm({
    defaultValues: initial,
    canSubmitWhenInvalid: true,
    onSubmit: ({ value }) => {
      failure.close();
      setErrors({});
      submitted.current = value;
      sending.current = true;
      onEditing?.(true);
      saving.mutate(value);
    },
  });

  const hasChanges = (): boolean => {
    const current = form.state.values;

    return (
      Boolean(root.current?.querySelector("[data-uncommitted-input]")) ||
      hasUnsavedChanges(base, { saved: saved.current, current }) ||
      (saving.isPending &&
        hasUnsavedChanges(base, { saved: submitted.current, current }))
    );
  };

  const leaving = useLeaveConfirmation(hasChanges);

  const reportEditing = (): void => {
    onEditing?.(
      sending.current ||
        (saved.current === initial && !form.state.isDefaultValue) ||
        hasChanges(),
    );
  };

  const finishSaving = (): void => {
    sending.current = false;

    if (root.current !== null) reportEditing();
  };

  const observeInput = (node: HTMLDivElement | null) => {
    attachRoot(node);

    if (node === null) return;

    const observer = new MutationObserver(reportEditing);
    observer.observe(node, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-uncommitted-input"],
    });

    return () => {
      observer.disconnect();
      attachRoot(null);
    };
  };

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
    reportEditing();
    setErrors((previous) => clearChangedErrors(previous, name));
  };

  return {
    form,
    fields: base.fields,
    errors,
    changed,
    check,
    root: observeInput,
    saving,
    leaving,
  };
};

/** 固定ページの各項目が使うフォーム。 */
export type EditorForm = ReturnType<typeof useEditorForm>["form"];
