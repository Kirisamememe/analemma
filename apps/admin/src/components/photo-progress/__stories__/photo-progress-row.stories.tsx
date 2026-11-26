import type { Meta, StoryObj } from "@storybook/react-vite";

import { PhotoProgressRow } from "@/components/photo-progress/photo-progress-row";
import { ActionList } from "@/ui/primitives/collections";

const meta = {
  title: "components/PhotoProgressRow",
  component: PhotoProgressRow,
  args: {
    name: "2025-11/DSC09812.jpg",
    detail: "18.4 MB・11月23日 21:04",
    status: "待っています",
    tone: "neutral",
    busy: false,
  },
  decorators: [
    (Story) => (
      <ActionList>
        <Story />
      </ActionList>
    ),
  ],
  parameters: { stage: "fill" },
} satisfies Meta<typeof PhotoProgressRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Waiting: Story = {};

export const Busy: Story = {
  args: { status: "取り込んでいます", tone: "info", busy: true },
};

export const Added: Story = {
  args: { status: "足した", tone: "success", href: "/images/019b0000" },
};

export const Failed: Story = {
  args: { status: "大きすぎます(64 MB まで)", tone: "danger" },
};
