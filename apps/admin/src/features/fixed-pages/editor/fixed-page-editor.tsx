import {
  memo,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { EditorFields } from "./frame/editor-fields";
import { EditorHeader } from "./frame/editor-header";
import { LeaveDialog } from "./frame/leave-dialog";
import {
  type FixedPageEditorProps,
  useEditorForm,
} from "./hooks/use-editor-form";
import {
  type EditorHold,
  fieldsChangedSinceEditing,
  fieldsInUse,
  holdWhileDeleting,
  holdWhileEditing,
  pageInUse,
} from "./logic/editor-fields";

import { KindRefreshNotice } from "@/features/fixed-pages/list/kind-refresh-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

type EditorProps = {
  /** 編集する固定ページと種類。 */
  pageProps: FixedPageEditorProps;
  /** 未保存の入力があるかが変わったときに呼ぶ関数。 */
  onEditing: (editing: boolean) => void;
  /** 削除の確認を開いたときと閉じたときに呼ぶ関数。 */
  onDeleteOpen: (open: boolean) => void;
  /** 入力を始めた後に項目が更新されたか。 */
  fieldsChanged: boolean;
};

const EditorContent = ({
  pageProps: props,
  onEditing,
  onDeleteOpen,
  fieldsChanged,
}: EditorProps): ReactNode => {
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

const Editor = memo(EditorContent);

/** 種類の定義に沿って固定ページを作成・編集する、見出しとフォーム。 */
export const FixedPageEditor = (props: FixedPageEditorProps): ReactNode => {
  const [hold, setHold] = useState<EditorHold>({});
  const latest = props.kind.fields;
  const fields = fieldsInUse(hold, latest);
  const key = useMemo(() => JSON.stringify(fields), [fields]);
  const { acknowledged } = hold;
  const activeName = useRef<string>(undefined);

  const restoreFocus = useCallback((element: HTMLDivElement | null) => {
    if (element === null) return;

    if (activeName.current !== undefined) {
      const target =
        Array.from(element.querySelectorAll<HTMLElement>("[name]")).find(
          (field) =>
            field.getAttribute("name") === activeName.current &&
            field.tabIndex >= 0,
        ) ?? element.querySelector<HTMLElement>('[name="title"]');

      target?.focus();
      activeName.current = undefined;
    }

    return () => {
      const active = document.activeElement;

      if (active !== null && element.contains(active)) {
        activeName.current = active.getAttribute("name") ?? "title";
      }
    };
  }, []);

  const onEditing = useCallback(
    (editing: boolean) => {
      setHold((current) => holdWhileEditing(current, { editing, latest }));
    },
    [latest],
  );

  const onDeleteOpen = useCallback(
    (open: boolean) => {
      setHold((current) => holdWhileDeleting(current, { open, latest }));
    },
    [latest],
  );

  const pageProps = useMemo((): FixedPageEditorProps => {
    const kind = { ...props.kind, fields };

    if (props.page === undefined) return { ...props, kind };

    const before = props.page;

    return {
      ...props,
      kind,
      page: pageInUse({ acknowledged }, before),
      onSaved: (saved) => {
        setHold((current) => ({ ...current, acknowledged: { before, saved } }));
        props.onSaved(saved);
      },
    };
  }, [props, fields, acknowledged]); // 入力を始めた・やめただけでは作り直さず、フォームを描き直さない

  return (
    <div key={key} ref={restoreFocus}>
      <Editor
        pageProps={pageProps}
        fieldsChanged={fieldsChangedSinceEditing(hold, latest)}
        onDeleteOpen={onDeleteOpen}
        onEditing={onEditing}
      />
    </div>
  );
};
