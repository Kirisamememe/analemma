import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Form } from "@/ui/primitives/form";
import { Checkbox } from "@/ui/primitives/form-fields/choices/checkbox";
import { CheckboxInput } from "@/ui/primitives/form-fields/choices/checkbox-input";

const meta = {
  title: "primitives/Checkbox",
  component: Checkbox,
  parameters: { stage: "fill" },
  args: {
    name: "pinned",
    label: "先頭に表示する",
    description: "一覧でこのページを先頭に表示します",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InputOnly: Story = {
  /** ラベルを描かない Checkbox の見本。 */
  render: () => <CheckboxInput aria-label="先頭に表示する" />,
};

export const Checked: Story = { args: { defaultSelected: true } };

export const Required: Story = { args: { isRequired: true } };

export const ReadOnly: Story = {
  args: { defaultSelected: true, isReadOnly: true },
};

export const Disabled: Story = {
  args: { defaultSelected: true, isDisabled: true },
};

export const DisabledUnchecked: Story = { args: { isDisabled: true } };

export const Invalid: Story = {
  decorators: [
    (Story) => (
      <Form
        onSubmit={fn<(data: FormData) => void>()}
        validationErrors={{ pinned: "表示位置を確認してください。" }}
      >
        <Story />
      </Form>
    ),
  ],
};

export const InvalidChecked: Story = {
  args: {
    defaultSelected: true,
    errorMessage: "表示位置を確認してください。",
  },
};
