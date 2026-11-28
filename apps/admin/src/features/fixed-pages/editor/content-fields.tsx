import { memo, type ReactNode } from "react";

import type { FieldDefinition } from "@analemma/contract";

import { Branch } from "../ui/branch";
import { ContentGroup } from "../ui/content-group";
import type { EditorField, EditorForm } from "./hooks/use-editor-form";
import { ImageField } from "./image-field";
import type { RefusedSave } from "./logic/editor-errors";
import { RepeatField } from "./repeat/repeat-field";

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
  /** 最後に送った画像の項目の誤り。 */
  imageErrors: RefusedSave["images"];
  /** ここまでの group と repeat の要素名。 */
  parentLabel?: string;
  /** 値の変更を知らせる関数。 */
  changed: (name: string) => void;
  /** group の直下の項目か。 */
  inGroup?: boolean;
};

/** 入力欄を描くのに要る、項目の定義と文言。 */
type InputOptions = {
  /** 項目の定義。 */
  readonly definition: Exclude<
    FieldDefinition,
    Record<"fields", readonly FieldDefinition[]>
  >;
  /** 操作する項目と、そこまでの group や repeat の要素名。 */
  readonly target: string;
  /** 最後に送った画像の項目の誤り。 */
  readonly issue: NonNullable<RefusedSave["images"]>[string] | undefined;
  /** URL の項目の補足。 */
  readonly urlGuide: string;
};

const drawInput = (
  field: EditorField,
  { definition, target, issue, urlGuide }: InputOptions,
): ReactNode => {
  const required = definition.optional !== true;
  const { label } = definition;

  switch (definition.type) {
    case "text":
      return <field.TextField label={label} isRequired={required} />;
    case "image":
      return (
        <ImageField
          label={label}
          required={required}
          target={target}
          issue={issue}
          value={
            typeof field.state.value === "string" ? field.state.value : null
          }
          onChange={field.handleChange}
        />
      );
    case "url":
      return (
        <field.TextField
          description={urlGuide}
          isRequired={required}
          label={label}
        />
      );
    case "longText":
      return <field.TextArea label={label} isRequired={required} />;
    case "number":
      return <field.NumberField label={label} isRequired={required} />;
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
};

const ContentFieldsContent = ({
  fields,
  prefix,
  form,
  errors,
  changed,
  parentLabel = "",
  imageErrors,
  inGroup = false,
}: ContentFieldsProps): ReactNode => {
  const t = useTranslate();

  const target = (label: string) =>
    parentLabel === "" ? label : parentLabel + " / " + label;

  const draw = (definition: FieldDefinition): ReactNode => {
    const path = prefix + definition.key;
    const name = `content.${path}` as const;

    if ("fields" in definition) {
      const nested = (parent: string, label?: string) => (
        <ContentFields
          fields={definition.fields}
          prefix={parent + "/"}
          imageErrors={imageErrors}
          parentLabel={target(label ?? definition.label)}
          form={form}
          errors={errors}
          changed={changed}
          inGroup={definition.type === "group"}
        />
      );

      return (
        <ContentGroup
          key={path}
          inGroup={inGroup}
          kind={definition.type}
          label={definition.label}
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

    const label = definition.label;

    return (
      <form.AppField
        key={path}
        name={name}
        listeners={{
          onChange: () => {
            changed(name);
          },
        }}
      >
        {(field) =>
          drawInput(field, {
            definition,
            target: target(label),
            issue: imageErrors?.[name],
            urlGuide: t("fixedPageEditor.guide.url"),
          })
        }
      </form.AppField>
    );
  };

  return fields.map((definition, index) => {
    const element = draw(definition);

    if (!inGroup) return element;

    const isLast = index === fields.length - 1;

    return (
      <Branch
        key={prefix + definition.key}
        isLast={isLast}
        parent="group"
        target={"fields" in definition ? "heading" : undefined}
      >
        {element}
      </Branch>
    );
  });
};

/** 定義の順に、中身の各項目を描く。 */
export const ContentFields = memo(ContentFieldsContent); // repeat の要素を動かしても、中の repeat の要素まで描き直さない
