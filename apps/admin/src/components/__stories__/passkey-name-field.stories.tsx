import type { Meta, StoryObj } from "@storybook/react-vite";

import { PasskeyNameField } from "@/components/passkey-name-field";

const meta = {
  title: "components/PasskeyNameField",
  component: PasskeyNameField,
} satisfies Meta<typeof PasskeyNameField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithDescription: Story = {
  args: { showDescription: true },
};

export const WithDefaultValue: Story = {
  args: { defaultValue: "MacBook" },
};
