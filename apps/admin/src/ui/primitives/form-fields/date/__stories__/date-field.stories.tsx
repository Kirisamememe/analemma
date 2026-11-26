import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { DateField } from "@/ui/primitives/form-fields/date/date-field";
import { DateInput } from "@/ui/primitives/form-fields/date/date-input";

const meta = {
  title: "primitives/DateField",
  component: DateField,
  parameters: { stage: "fill" },
  args: {
    name: "published",
    label: "公開日",
    description: "記事に表示する日付です",
  },
} satisfies Meta<typeof DateField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InputOnly: Story = {
  /** ラベルを描かない日付入力の見本。 */
  render: () => <DateInput aria-label="公開日" />,
};

export const Filled: Story = { args: { defaultValue: "2024-02-29" } };

export const Required: Story = { args: { isRequired: true } };

export const ReadOnly: Story = {
  args: { defaultValue: "2024-02-29", isReadOnly: true },
};

export const Disabled: Story = {
  args: { defaultValue: "2024-02-29", isDisabled: true },
};

export const Invalid: Story = {
  decorators: [
    (Story) => (
      <Form
        onSubmit={fn<(data: FormData) => void>()}
        validationErrors={{ published: "公開日を確認してください。" }}
      >
        <Story />
      </Form>
    ),
  ],
  args: { defaultValue: "2024-02-29" },
};

export const InForm: Story = {
  decorators: [
    (Story) => (
      <Form onSubmit={fn<(data: FormData) => void>()}>
        <Story />
        <Button type="submit">保存</Button>
      </Form>
    ),
  ],
  args: { isRequired: true },
};
