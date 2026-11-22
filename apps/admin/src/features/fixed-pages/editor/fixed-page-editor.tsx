import type { ReactNode } from "react";

import { ContentFields } from "./content-fields";
import { type FixedPageEditorProps, useEditorForm } from "./use-editor-form";

import { useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { Notice } from "@/ui/primitives/notice";

/** 種類の定義に沿って固定ページを作成・編集するフォーム。 */
export const FixedPageEditor = (props: FixedPageEditorProps): ReactNode => {
  const { form, fields, errors, changed, check, root, saving } =
    useEditorForm(props);
  const t = useTranslate();

  return (
    <div ref={root}>
      <Form
        isPending={saving.isPending}
        onSubmit={() => {
          if (!form.state.isSubmitting) void form.handleSubmit();
        }}
        validationErrors={errors.fields}
      >
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
        </Stack>
        {errors.notice !== undefined && (
          <Notice tone="danger">{errors.notice}</Notice>
        )}
        {saving.isError && (
          <Notice tone="danger">{t("fixedPageEditor.saveFailed")}</Notice>
        )}
        <Button isPending={saving.isPending} type="submit" tone="primary">
          {t("fixedPageEditor.save")}
        </Button>
      </Form>
    </div>
  );
};
