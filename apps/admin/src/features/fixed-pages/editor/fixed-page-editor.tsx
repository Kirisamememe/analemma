import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";

import { ContentFields } from "./content-fields";
import { DeleteFixedPage } from "./delete-fixed-page";
import {
  type FixedPageEditorProps,
  useEditorForm,
} from "./hooks/use-editor-form";

import type { LeaveConfirmation } from "@/api/use-leave-confirmation";
import { KindRefreshNotice } from "@/features/fixed-pages/list/kind-refresh-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";
import { Dialog } from "@/ui/primitives/overlays";

/** 離れる前の確かめに渡す値。 */
type LeaveDialogProps = {
  /** 確かめの状態。 */
  leaving: LeaveConfirmation;
};

const LeaveDialog = ({ leaving }: LeaveDialogProps): ReactNode => {
  const t = useTranslate();

  const stay = (): void => {
    if (leaving._tag === "Asking") leaving.stay();
  };

  return (
    <Dialog
      isOpen={leaving._tag === "Asking"}
      onOpenChange={(open) => {
        if (!open) stay();
      }}
      title={t("fixedPageEditor.leaveTitle")}
    >
      <Text>{t("fixedPageEditor.leaveDescription")}</Text>
      <Cluster gap={2} justify="end">
        <Button onPress={stay}>{t("fixedPageEditor.stay")}</Button>
        <Button
          onPress={() => {
            if (leaving._tag === "Asking") leaving.leave();
          }}
          tone="danger"
        >
          {t("fixedPageEditor.leave")}
        </Button>
      </Cluster>
    </Dialog>
  );
};

const focusIfLost = (input: HTMLInputElement | null): void => {
  const active = document.activeElement;

  if (active === null || active === document.body) input?.focus(); // 押した種類のボタンが消え、focus の行き先が無いとき
};

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

const Editor = ({
  pageProps: props,
  onEditing,
  onDeleteOpen,
  fieldsChanged,
}: EditorProps): ReactNode => {
  const { form, fields, root, errors, changed, check, saving, leaving } =
    useEditorForm(props, onEditing);

  const { kind, page } = props;
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
            <PageHeader
              actions={
                props.page !== undefined && (
                  <>
                    <DeleteFixedPage
                      onDeleted={props.onDeleted}
                      onOpenChange={onDeleteOpen}
                      page={props.page}
                    />
                    {save}
                  </>
                )
              }
              description={t("fixedPageEditor.kindOf", { kind: kind.label })}
              title={t(
                page === undefined
                  ? "fixedPageEditor.new"
                  : "fixedPageEditor.edit",
              )}
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
            <Stack gap={4}>
              {(["slug", "title"] as const).map((name) => (
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
                        name === "slug"
                          ? "fixedPageEditor.slug"
                          : "fixedPageEditor.title",
                      )}
                      description={
                        name === "slug"
                          ? t("fixedPageEditor.slugHint")
                          : undefined
                      }
                      inputRef={
                        name === "slug" && props.picked === true
                          ? focusIfLost
                          : undefined
                      }
                      isRequired
                    />
                  )}
                </form.AppField>
              ))}
              <ContentFields
                form={form}
                fields={fields}
                prefix=""
                errors={errors}
                changed={changed}
              />
              <Cluster justify="end">{save}</Cluster>
            </Stack>
          </Stack>
        </form.Form>
      </form.AppForm>
      <LeaveDialog leaving={leaving} />
    </div>
  );
};

/** 種類の定義に沿って固定ページを作成・編集する、見出しとフォーム。 */
export const FixedPageEditor = (props: FixedPageEditorProps): ReactNode => {
  const [editedFields, setEditedFields] =
    useState<FixedPageEditorProps["kind"]["fields"]>();

  const [deletingFields, setDeletingFields] =
    useState<FixedPageEditorProps["kind"]["fields"]>();

  const [acknowledged, setAcknowledged] = useState<{
    /** 保存を送った時点で表示していたページ。 */
    before: NonNullable<FixedPageEditorProps["page"]>;
    /** 保存が成功した後のページ。 */
    saved: NonNullable<FixedPageEditorProps["page"]>;
  }>();

  const fields = editedFields ?? deletingFields ?? props.kind.fields;
  const key = useMemo(() => JSON.stringify(fields), [fields]);

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

  const pageProps =
    props.page === undefined
      ? props
      : {
          ...props,
          page:
            acknowledged?.before === props.page
              ? acknowledged.saved
              : props.page,
          onSaved: (saved: NonNullable<FixedPageEditorProps["page"]>) => {
            setAcknowledged({ before: props.page, saved });
            props.onSaved(saved);
          },
        };

  return (
    <div key={key} ref={restoreFocus}>
      <Editor
        pageProps={{ ...pageProps, kind: { ...props.kind, fields } }}
        fieldsChanged={
          editedFields !== undefined && editedFields !== props.kind.fields
        }
        onDeleteOpen={(open) => {
          setDeletingFields(open ? fields : undefined);
        }}
        onEditing={(editing) => {
          setEditedFields(editing ? fields : undefined);
        }}
      />
    </div>
  );
};
