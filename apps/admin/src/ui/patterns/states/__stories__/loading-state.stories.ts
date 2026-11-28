import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoadingState } from "@/ui/patterns/states/loading-state";

const meta = {
  title: "patterns/LoadingState",
  component: LoadingState,
  args: { layout: "list", label: "読み込んでいます" },
  parameters: { stage: "fill" },
} satisfies Meta<typeof LoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const List: Story = {};

export const Form: Story = {
  args: { layout: "form" },
};
