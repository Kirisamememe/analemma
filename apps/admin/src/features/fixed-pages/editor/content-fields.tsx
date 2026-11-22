import type { ReactNode } from "react";

import type { FieldDefinition } from "@analemma/contract";

import { ContentGroup } from "../ui/content-group";
import { RepeatField } from "./repeat-field";
import type { EditorForm } from "./use-editor-form";

import { useTranslate } from "@/i18n/use-translate";

/** 同じ段にある項目に渡す値。 */
export type ContentFieldsProps = {
  /** 項目の定義。 */
  fields: readonly FieldDefinition[];
  /** 親の場所。 */
  prefix: string;
  /** 項目を登録するフォーム。 */
  form: EditorForm;
  /** 各項目の誤りの知らせ。 */
  errors: Record<string, string>;
  /** 値の変更を知らせる関数。 */
  changed: (name: string) => void;
};

/** 定義の順に、中身の各項目を描く。 */
export const ContentFields = ({
  fields,
  prefix,
  form,
  errors,
  changed,
}: ContentFieldsProps): ReactNode => {
  const t = useTranslate();

  return fields.map((definition) => {
    const path = prefix + definition.key;
    const name = `content.${path}` as const;

    if ("fields" in definition) {
      const nested = (parent: string) => (
        <ContentFields
          fields={definition.fields}
          prefix={parent + "/"}
          form={form}
          errors={errors}
          changed={changed}
        />
      );

      return (
        <ContentGroup
          key={path}
          label={definition.label}
          name={name}
          error={errors[name]}
        >
          {definition.type === "group" ? (
            nested(path)
          ) : (
            <RepeatField
              form={form}
              path={path}
              definition={definition}
              changed={changed}
              errors={errors}
            >
              {nested}
            </RepeatField>
          )}
        </ContentGroup>
      );
    }

    const required = !definition.optional;
    const label = definition.label;

    return (
      <div key={path} data-field={name}>
        <form.AppField
          name={name}
          listeners={{
            onChange: () => {
              changed(name);
            },
          }}
        >
          {(field) => {
            switch (definition.type) {
              case "text":
                return <field.TextField label={label} isRequired={required} />;
              case "url":
                return (
                  <field.TextField
                    description={t("fixedPageEditor.urlHint")}
                    isRequired={required}
                    label={label}
                  />
                );
              case "longText":
                return <field.TextArea label={label} isRequired={required} />;
              case "number":
                return (
                  <field.NumberField label={label} isRequired={required} />
                );
              case "boolean":
                return <field.Checkbox label={label} />;
              case "date":
                return <field.DateField label={label} isRequired={required} />;
              case "select":
                return (
                  <field.Select
                    label={label}
                    isRequired={required}
                    options={definition.options}
                  />
                );
            }
          }}
        </form.AppField>
      </div>
    );
  });
};
