import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

type Values = {
  /** 公開日。 */
  published: string | null;
  /** 一覧で先頭に表示するか。 */
  pinned: boolean;
  /** 公開サイトで使う季節。 */
  season: string | null;
};

const INITIAL_VALUES: Values = {
  published: "2024-02-29",
  pinned: false,
  season: "spring",
};

const OPTIONS = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
  { value: "autumn", label: "秋" },
  { value: "winter", label: "冬" },
];

const FormExample = (): ReactNode => {
  const [saved, setSaved] = useState<Values>();

  const form = useAppForm({
    defaultValues: INITIAL_VALUES,
    onSubmit: ({ value }) => {
      setSaved(value);
    },
  });

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <form.AppForm>
          <form.Form>
            <form.AppField
              name="published"
              validators={{
                onBlur: ({ value }) =>
                  value === null ? "公開日を入力してください。" : undefined,
              }}
            >
              {(field) => (
                <field.DateField
                  description="記事に表示する日付です"
                  isRequired
                  label="公開日"
                />
              )}
            </form.AppField>
            <form.AppField name="pinned">
              {(field) => (
                <field.Checkbox
                  description="一覧でこのページを先頭に表示します"
                  label="先頭に表示する"
                />
              )}
            </form.AppField>
            <form.AppField name="season">
              {(field) => (
                <field.Select
                  description="公開サイトで使う季節を選びます"
                  label="季節"
                  options={OPTIONS}
                />
              )}
            </form.AppField>
            <Button isPending={isSubmitting} type="submit">
              保存
            </Button>
            {saved !== undefined && (
              <Notice tone="success">{JSON.stringify(saved)}</Notice>
            )}
          </form.Form>
        </form.AppForm>
      )}
    </form.Subscribe>
  );
};

const meta = {
  title: "components/ChoiceDateForm",
  component: FormExample,
  parameters: { stage: "fill" },
} satisfies Meta<typeof FormExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
