import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "@/ui/primitives/graphics/skeleton";

const meta = {
  title: "primitives/Skeleton",
  component: Skeleton,
  args: { shape: "text", width: "md" },
  parameters: { stage: "fill" },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {};

export const Caption: Story = {
  args: { shape: "caption", width: "lg" },
};

export const Control: Story = {
  args: { shape: "control", width: "full" },
};

export const SmallControl: Story = {
  args: { shape: "control-sm", width: "xs" },
};
