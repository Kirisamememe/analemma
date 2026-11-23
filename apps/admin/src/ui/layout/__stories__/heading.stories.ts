import type { Meta, StoryObj } from "@storybook/react-vite";

import { Heading } from "@/ui/layout/heading";

const meta = {
  title: "layout/Heading",
  component: Heading,
  args: { level: 1, children: "パスキーとセッション" },
  parameters: { stage: "fill" },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Page: Story = {};

export const Section: Story = { args: { level: 2, children: "パスキー" } };

export const Display: Story = {
  args: { level: 1, variant: "display", children: "Stilus" },
};
