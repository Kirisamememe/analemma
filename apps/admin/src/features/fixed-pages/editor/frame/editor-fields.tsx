import type { ReactNode } from "react";

import { ContentFields } from "../content-fields";
import type { useEditorForm } from "../hooks/use-editor-form";
import { PageFields } from "./page-fields";

import { Cluster, Stack } from "@/ui/layout";

type Editor = ReturnType<typeof useEditorForm>;

/** フォームの欄の並びに渡す値。 */
type EditorFieldsProps = Pick<
  Editor,
  "form" | "fields" | "errors" | "imageErrors" | "check" | "changed"
> & {
  /** 種類を選んで開いた直後か。 */
  picked: boolean;
  /** 保存のボタン。 */
  save: ReactNode;
};

/** ページの欄、種類の定義の項目、保存のボタンを縦に並べる。 */
export const EditorFields = ({
  form,
  fields,
  errors,
  imageErrors,
  check,
  changed,
  picked,
  save,
}: EditorFieldsProps): ReactNode => (
  <Stack gap={4}>
    <PageFields form={form} check={check} changed={changed} picked={picked} />
    <ContentFields
      form={form}
      fields={fields}
      imageErrors={imageErrors}
      prefix=""
      errors={errors}
      changed={changed}
    />
    <Cluster justify="end">{save}</Cluster>
  </Stack>
);
