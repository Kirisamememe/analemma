import type { ReactNode } from "react";

import { ContentFields } from "./content-fields";
import { DeleteFixedPage } from "./delete-fixed-page";
import {
  type FixedPageEditorProps,
  useEditorForm,
} from "./hooks/use-editor-form";

import type { LeaveConfirmation } from "@/api/leave-confirmation";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
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

/** 種類の定義に沿って固定ページを作成・編集する、見出しとフォーム。 */
export const FixedPageEditor = (props: FixedPageEditorProps): ReactNode => {
  const { form, fields, errors, changed, check, root, saving, leaving } =
    useEditorForm(props);

  const { kind, page } = props;
  const t = useTranslate();

  const save = (
    <Button isPending={saving.isPending} type="submit" tone="primary">
      {t("fixedPageEditor.save")}
    </Button>
  );

  return (
    <div ref={root}>
      <Form
        isPending={saving.isPending}
        onSubmit={() => {
          if (!form.state.isSubmitting) void form.handleSubmit();
        }}
        validationErrors={errors.fields}
      >
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
          <Stack gap={4}>
            {(["slug", "title"] as const).map((name) => (
              <div key={name} data-field={name}>
                <form.AppField
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
                      isRequired
                    />
                  )}
                </form.AppField>
              </div>
            ))}
            <ContentFields
              form={form}
              fields={fields}
              prefix=""
              errors={errors.fields}
              changed={changed}
            />
            {errors.notice !== undefined && (
              <div data-form-error tabIndex={-1}>
                <Notice tone="danger">{errors.notice}</Notice>
              </div>
            )}
            <Cluster justify="end">{save}</Cluster>
          </Stack>
        </Stack>
      </Form>
      <LeaveDialog leaving={leaving} />
    </div>
  );
};
