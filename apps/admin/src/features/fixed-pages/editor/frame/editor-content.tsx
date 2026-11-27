import { memo, type ReactNode } from "react";

import {
  type FixedPageEditorProps,
  useEditorForm,
} from "../hooks/use-editor-form";
import { EditorFields } from "./editor-fields";
import { EditorHeader } from "./editor-header";
import { LeaveDialog } from "./leave-dialog";

import { KindRefreshNotice } from "@/features/fixed-pages/list/kind-refresh-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** 編集のフォームの全体に渡す値。 */
type EditorContentProps = {
  /** 編集する固定ページと種類。 */
  pageProps: FixedPageEditorProps;
  /** 未保存の入力があるかが変わったときに呼ぶ関数。 */
  onEditing: (editing: boolean) => void;
  /** 削除の確認を開いたときと閉じたときに呼ぶ関数。 */
  onDeleteOpen: (open: boolean) => void;
  /** 入力を始めた後に項目が更新されたか。 */
  fieldsChanged: boolean;
};

const Content = ({
  pageProps: props,
  onEditing,
  onDeleteOpen,
  fieldsChanged,
}: EditorContentProps): ReactNode => {
  const editor = useEditorForm(props, onEditing);

  const { form, fields, root, errors, changed, check, saving, leaving } =
    editor;

  const t = useTranslate();

  const save = (
    <Button isPending={saving.isPending} type="submit" tone="primary">
      {t("fixedPageEditor.save")}
    </Button>
  );

  return (
    <div ref={root}>
      <form.AppForm>
        <form.Form isPending={saving.isPending} validationErrors={errors}>
          <Stack gap={8}>
            <EditorHeader
              pageProps={props}
              onDeleteOpen={onDeleteOpen}
              save={save}
            />
            {props.refreshFailure !== undefined && (
              <KindRefreshNotice
                source="definition"
                refreshFailure={props.refreshFailure}
              />
            )}
            {fieldsChanged && (
              <Notice tone="warning">
                {t("fixedPageEditor.updatedFields")}
              </Notice>
            )}
            <EditorFields
              form={form}
              fields={fields}
              errors={errors}
              imageErrors={editor.imageErrors}
              check={check}
              changed={changed}
              picked={props.picked === true}
              save={save}
            />
          </Stack>
        </form.Form>
      </form.AppForm>
      <LeaveDialog leaving={leaving} />
    </div>
  );
};

/** 見出し・知らせ・欄と、離れる前の確かめを並べた、編集のフォームの全体。 */
export const EditorContent = memo(Content);
