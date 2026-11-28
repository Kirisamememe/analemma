import type { ReactNode } from "react";

import type { useEditorForm } from "../hooks/use-editor-form";

import { useTranslate } from "@/i18n/use-translate";

type Editor = ReturnType<typeof useEditorForm>;

/** ページの slug とタイトルの欄に渡す値。 */
type PageFieldsProps = Pick<Editor, "form" | "check" | "changed"> & {
  /** 種類を選んで開いた直後か。 */
  picked: boolean;
};

const focusIfLost = (input: HTMLInputElement | null): void => {
  const active = document.activeElement;

  if (active === null || active === document.body) input?.focus(); // 押した種類のボタンが消え、focus の行き先が無いとき
};

/** どの種類の固定ページにもある、slug とタイトルの欄。 */
export const PageFields = ({
  form,
  check,
  changed,
  picked,
}: PageFieldsProps): ReactNode => {
  const t = useTranslate();
  const slugRef = picked ? focusIfLost : undefined;

  return (["slug", "title"] as const).map((name) => (
    <form.AppField
      key={name}
      name={name}
      validators={{ onBlur: check(name) }}
      listeners={{
        onChange: () => {
          changed(name);
        },
      }}
    >
      {(field) => (
        <field.TextField
          label={t(
            name === "slug" ? "fixedPageEditor.slug" : "fixedPageEditor.title",
          )}
          description={
            name === "slug" ? t("fixedPageEditor.guide.slug") : undefined
          }
          inputRef={name === "slug" ? slugRef : undefined}
          isRequired
        />
      )}
    </form.AppField>
  ));
};
