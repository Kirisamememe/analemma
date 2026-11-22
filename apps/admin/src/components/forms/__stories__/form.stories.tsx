import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { Notice } from "@/ui/primitives/notice";

const FormExample = (): ReactNode => {
  const [savedTitle, setSavedTitle] = useState<string>();
  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: { title: "" },
    validators: {
      onSubmitAsync: ({ value }) =>
        Promise.resolve(
          value.title === "お知らせ"
            ? { fields: { title: "このタイトルはすでに使われています" } }
            : undefined,
        ),
    },
    onSubmit: ({ value }) => {
      setSavedTitle(value.title);
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
          <form.AppField
            name="title"
            validators={{
              onBlur: ({ value }) =>
                value.trim() === "" ? "タイトルを入力してください" : undefined,
            }}
          >
            {(field) => (
              <field.TextField
                description="「お知らせ」は使用済みのタイトルです。"
                isRequired
                label="タイトル"
              />
            )}
          </form.AppField>
          <Button isPending={isSubmitting} type="submit">
            保存
          </Button>
          {savedTitle !== undefined && (
            <Notice tone="success">「{savedTitle}」を保存しました。</Notice>
          )}
        </Form>
      )}
    </form.Subscribe>
  );
};

const meta = {
  title: "components/Form",
  component: FormExample,
  parameters: { stage: "fill" },
} satisfies Meta<typeof FormExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextField: Story = {};
