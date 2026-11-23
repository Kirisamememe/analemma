import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { Notice } from "@/ui/primitives/notice";

type Values = {
  /** タイトル。 */
  title: string;
  /** 本文。 */
  body: string;
  /** 並べる順。 */
  order: number | null;
  /** 公開日。 */
  published: string | null;
  /** 一覧で先頭に表示するか。 */
  pinned: boolean;
  /** 公開サイトで使う季節。 */
  season: string | null;
};

const INITIAL_VALUES: Values = {
  title: "春の便り",
  body: "桜が咲きました。",
  order: 1,
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

const wait = (milliseconds: number): Promise<undefined> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, milliseconds);
  });

type SubmittingFormProps = {
  /** 送信の検証が答えるまでの時間(ミリ秒)。 */
  validationMilliseconds: number;
};

const SubmittingForm = ({
  validationMilliseconds,
}: SubmittingFormProps): ReactNode => {
  const [saved, setSaved] = useState<Values>();
  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: INITIAL_VALUES,
    validators: { onSubmitAsync: () => wait(validationMilliseconds) },
    onSubmit: ({ value }) => {
      setSaved(value);
    },
  });

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Form
          isPending={isSubmitting}
          onSubmit={() => {
            void form.handleSubmit();
          }}
        >
          <form.AppField name="title">
            {(field) => (
              <field.TextField
                description="保存を押すと、検証が終わるまで入力を止めます。"
                label="タイトル"
              />
            )}
          </form.AppField>
          <form.AppField name="body">
            {(field) => <field.TextArea label="本文" />}
          </form.AppField>
          <form.AppField name="order">
            {(field) => <field.NumberField label="順番" />}
          </form.AppField>
          <form.AppField name="published">
            {(field) => <field.DateField label="公開日" />}
          </form.AppField>
          <form.AppField name="pinned">
            {(field) => <field.Checkbox label="先頭に表示する" />}
          </form.AppField>
          <form.AppField name="season">
            {(field) => <field.Select label="季節" options={OPTIONS} />}
          </form.AppField>
          <Button isPending={isSubmitting} type="submit">
            保存
          </Button>
          {saved !== undefined && (
            <Notice tone="success">{JSON.stringify(saved)}</Notice>
          )}
        </Form>
      )}
    </form.Subscribe>
  );
};

const meta = {
  title: "components/SubmittingForm",
  component: SubmittingForm,
  parameters: { stage: "fill" },
  args: { validationMilliseconds: 3000 },
} satisfies Meta<typeof SubmittingForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SlowValidation: Story = {};
