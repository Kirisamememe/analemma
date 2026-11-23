import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/ui/primitives/badge";

const meta = {
  title: "primitives/Badge",
  component: Badge,
  args: { tone: "neutral", children: "下書き" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Info: Story = { args: { tone: "info", children: "予約" } };

export const Success: Story = { args: { tone: "success", children: "公開中" } };

export const Warning: Story = {
  args: { tone: "warning", children: "期限が近い" },
};

export const Danger: Story = { args: { tone: "danger", children: "失敗" } };
