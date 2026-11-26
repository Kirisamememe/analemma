import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollView } from "../scroll-view";

import { Cluster, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";

const months = Array.from(
  { length: 12 },
  (_, index) => `${String(index + 1)}月の写真`,
);

const meta = {
  title: "primitives/ScrollView",
  component: ScrollView,
  parameters: { stage: "fill" },
  args: { label: "月ごとの写真", orientation: "horizontal", children: null },
} satisfies Meta<typeof ScrollView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    children: (
      <Cluster gap={4}>
        {months.map((month) => (
          <Badge tone="neutral" key={month}>
            {month}
          </Badge>
        ))}
      </Cluster>
    ),
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    maxHeight: 140,
    children: (
      <Stack gap={2}>
        {months.map((month) => (
          <Text key={month}>{month}</Text>
        ))}
      </Stack>
    ),
  },
};

export const Fits: Story = { args: { children: <Text>1月の写真</Text> } };
