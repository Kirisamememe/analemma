import { type ReactNode, useMemo, useState } from "react";

import { ContentFields } from "./content-fields";
import { DeleteFixedPage } from "./delete-fixed-page";
import {
  type FixedPageEditorProps,
  useEditorForm,
} from "./hooks/use-editor-form";

import type { LeaveConfirmation } from "@/api/use-leave-confirmation";
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
  /** 入力を始めた後に項目が更新されたか。 */
  fieldsChanged: boolean;
};

const Editor = ({
  pageProps: props,
  onEditing,
  fieldsChanged,
}: EditorProps): ReactNode => {
  const {
    form,
    fields,
    observeInput,
    errors,
    changed,
    check,
    saving,
    leaving,
  } = useEditorForm(props, onEditing);

  const { kind, page } = props;
  const t = useTranslate();

  const save = (
    <Button isPending={saving.isPending} type="submit" tone="primary">
      {t("fixedPageEditor.save")}
    </Button>
  );

  return (
    <div ref={observeInput}>
      <form.AppForm>
        <form.Form isPending={saving.isPending} validationErrors={errors}>
          <Stack gap={8}>
            <PageHeader
              actions={
                <>
                  {props.page !== undefined && (
                    <DeleteFixedPage
                      onDeleted={props.onDeleted}
                      page={props.page}
                    />
                  )}
                  {save}
                </>
              }
              description={t("fixedPageEditor.kindOf", { kind: kind.label })}
              title={t(
                page === undefined
                  ? "fixedPageEditor.new"
                  : "fixedPageEditor.edit",
              )}
            />
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

  const fields = editedFields ?? props.kind.fields;
  const key = useMemo(() => JSON.stringify(fields), [fields]);

  return (
    <Editor
      key={key}
      pageProps={{ ...props, kind: { ...props.kind, fields } }}
      fieldsChanged={fields !== props.kind.fields}
      onEditing={(editing) => {
        setEditedFields(editing ? fields : undefined);
      }}
    />
  );
};
