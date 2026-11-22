import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Form } from "@/ui/primitives/form";
import { Select } from "@/ui/primitives/form-fields/choices/select";
import { SelectInput } from "@/ui/primitives/form-fields/choices/select-input";

const meta = {
  title: "primitives/Select",
  component: Select,
  parameters: { stage: "fill" },
  args: {
    name: "season",
    label: "季節",
    description: "公開サイトで使う季節を選びます。",
    options: [
      { value: "spring", label: "春" },
      { value: "summer", label: "夏" },
      { value: "autumn", label: "秋" },
      { value: "winter", label: "冬" },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InputOnly: Story = {
  /** ラベルを描かない Select の見本。 */
  render: ({ options }) => <SelectInput aria-label="季節" options={options} />,
};

export const Selected: Story = { args: { defaultValue: "spring" } };

export const Required: Story = { args: { isRequired: true } };

export const Disabled: Story = {
  args: { defaultValue: "spring", isDisabled: true },
};

export const Invalid: Story = {
  decorators: [
    (Story) => (
      <Form
        onSubmit={fn<(data: FormData) => void>()}
        validationErrors={{ season: "季節を選び直してください。" }}
      >
        <Story />
      </Form>
    ),
  ],
  args: { defaultValue: "spring" },
};
