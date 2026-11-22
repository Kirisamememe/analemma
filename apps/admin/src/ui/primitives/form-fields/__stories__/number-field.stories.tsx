import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Form } from "../../form";
import { NumberField } from "../number-field";

const meta = {
  title: "primitives/NumberField",
  component: NumberField,
  parameters: { stage: "fill" },
  args: {
    name: "temperature",
    label: "気温 (°C)",
    description: "小数と負の値も入力できます。",
  },
} satisfies Meta<typeof NumberField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = { args: { defaultValue: -1.25 } };

export const Required: Story = { args: { isRequired: true } };

export const ReadOnly: Story = {
  args: { defaultValue: -1.25, isReadOnly: true },
};

export const Disabled: Story = {
  args: { defaultValue: -1.25, isDisabled: true },
};

export const Invalid: Story = {
  decorators: [
    (Story) => (
      <Form
        onSubmit={fn<(data: FormData) => void>()}
        validationErrors={{ temperature: "気温を確認してください。" }}
      >
        <Story />
      </Form>
    ),
  ],
  args: { defaultValue: -1.25 },
};
