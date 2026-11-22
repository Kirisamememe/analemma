import { useRef, useState } from "react";

import { contract } from "@analemma/contract";

import { createContentForm } from "../content-form";
import {
  clearChangedErrors,
  contentErrors,
  type EditorErrors,
} from "./editor-errors";
import { flattenContent, restoreContent } from "./flat-content";
import { saveFixedPage } from "./save-fixed-page";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiMutation, useApiCache } from "@/api/server-state/server-state";
import { useAppForm } from "@/components/forms";
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
const shape = contract.admin.fixedPages.create["~orpc"].inputSchema?.shape;

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
  const { refresh } = useApiCache();
  const root = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string[]>([]);
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
        if (root.current !== null) {
          toast({
            tone: "success",
            message: t(
              page === undefined ? "fixedPages.created" : "fixedPages.saved",
            ),
          });
          onSaved(result.data);
        }

        await refresh(["admin", "fixedPages"]);

        return;
      }

      let next: EditorErrors;

      switch (result._tag) {
        case "SLUG_TAKEN":
          next = { fields: { slug: t("fixedPages.slugTaken") } };
          break;
        case "InvalidContent":
          next = contentErrors(result.issues, t);
          break;
        case "NOT_FOUND":
          next = { fields: {}, notice: t("fixedPages.pageGone") };
          break;
        case "UNKNOWN_KIND":
          next = { fields: {}, notice: t("fixedPages.kindGone") };
          break;
      }

      pendingFocus.current = Object.keys(next.fields);
      setErrors(next);
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
      shape?.[key].safeParse(value).success === true
        ? undefined
        : t(
            key === "slug"
              ? "fixedPages.invalidSlug"
              : "fixedPages.invalidTitle",
          );
  const changed = (name: string) => {
    setErrors((previous) => clearChangedErrors(previous, name));
  };

  const attachRoot = (element: HTMLDivElement | null) => {
    root.current = element;

    if (
      element !== null &&
      !saving.isPending &&
      pendingFocus.current.length > 0
    ) {
      const names = pendingFocus.current;
      pendingFocus.current = [];
      focusError(element, names);
    }
  };

  return {
    form,
    fields: initial.fields,
    errors,
    changed,
    check,
    attachRoot,
    saving,
  };
};

/** 固定ページの各項目が使うフォーム。 */
export type EditorForm = ReturnType<typeof useEditorForm>["form"];
