import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextInput } from "@/ui/primitives/form-fields/text-input";

const meta = {
  title: "primitives/TextInput",
  component: TextInput,
  parameters: { stage: "fill" },
  args: {
    "aria-label": "タイトル",
  },
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = { args: { defaultValue: "お知らせ" } };
