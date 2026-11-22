import type { Meta, StoryObj } from "@storybook/react-vite";

import { Cluster } from "@/ui/layout/cluster";
import { Text } from "@/ui/layout/text";

const ITEMS = (
  <>
    <Text>MacBook Air</Text>
    <Text tone="muted">同期されている</Text>
    <Text tone="muted">最終使用 2026年11月22日</Text>
  </>
);

const meta = {
  title: "layout/Cluster",
  component: Cluster,
  args: { gap: 2, children: ITEMS },
  parameters: { stage: "fill" },
} satisfies Meta<typeof Cluster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Between: Story = { args: { justify: "between" } };

export const End: Story = { args: { justify: "end" } };

export const Baseline: Story = { args: { align: "baseline" } };
