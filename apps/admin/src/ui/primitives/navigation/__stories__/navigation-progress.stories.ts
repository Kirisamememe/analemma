import type { Meta, StoryObj } from "@storybook/react-vite";

import { NavigationProgress } from "@/ui/primitives/navigation/navigation-progress";

const meta = {
  title: "primitives/NavigationProgress",
  component: NavigationProgress,
  args: { isActive: true, label: "読み込んでいます" },
  parameters: { layout: "fullscreen", stage: null },
} satisfies Meta<typeof NavigationProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Idle: Story = {
  args: { isActive: false },
};
