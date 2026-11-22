import { useRef, useState } from "react";

import { fixedPageSlug, fixedPageTitle } from "@analemma/contract";

import { createContentForm } from "../content-form";
import {
  clearChangedErrors,
  contentErrors,
  type EditorErrors,
} from "./editor-errors";
import { fixedPageQueryKey, type LoadedFixedPage } from "./fixed-page-query";
import { flattenContent, restoreContent } from "./flat-content";
import { saveFixedPage } from "./save-fixed-page";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
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
  /** 編集する固定ページ。 */
  page?: Page | undefined;
  /** 保存できたときに呼ぶ関数。 */
  onSaved: (page: Page) => void;
};
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

/** 固定ページの入力と保存の状態を持つ。 */
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
  const [initial] = useState(() => {
    const { content, items, unknownKeys } = flattenContent(
      createContentForm(kind.fields, page?.content),
    );

    return {
      fields: kind.fields,
      unknownKeys,
      values: {
        slug: page?.slug ?? "",
        title: page?.title ?? "",
        content,
        items,
      },
    };
  });
  const [errors, setErrors] = useState<EditorErrors>({ fields: {} });

  const saving = useApiMutation({
    send: (value: typeof initial.values) =>
      saveFixedPage(api, {
        target: page === undefined ? { kind: kind.name } : { id: page.id },
        slug: value.slug,
        title: value.title,
        fields: initial.fields,
        submitted: restoreContent(initial.fields, {
          ...value,
          unknownKeys: initial.unknownKeys,
        }),
      }),
    onSuccess: async (result) => {
      if (result._tag === "Succeeded") {
        const isOpen = root.current !== null;

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

      let next: EditorErrors;

      switch (result._tag) {
        case "SLUG_TAKEN":
          next = { fields: { slug: t("fixedPageEditor.slugTaken") } };
          break;
        case "InvalidContent":
          next = contentErrors(result.issues, t);
          break;
        case "NOT_FOUND":
          next = { fields: {}, notice: t("fixedPageEditor.pageGone") };
          break;
        case "UNKNOWN_KIND":
          next = { fields: {}, notice: t("fixedPageEditor.kindGone") };
          break;
      }

      const names = Object.keys(next.fields);

      setErrors(next);
      requestAnimationFrame(() => {
        focusError(root.current, names);
      });
    },
  });
  const form = useAppForm({
    defaultValues: initial.values,
    canSubmitWhenInvalid: true,
    onSubmit: ({ value }) => {
      setErrors({ fields: {} });
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
    fields: initial.fields,
    errors,
    changed,
    check,
    root,
    saving,
  };
};

/** 固定ページの各項目が使うフォーム。 */
export type EditorForm = ReturnType<typeof useEditorForm>["form"];
