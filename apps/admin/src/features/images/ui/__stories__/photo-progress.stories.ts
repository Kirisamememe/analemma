import type { Meta, StoryObj } from "@storybook/react-vite";

import { PhotoProgress } from "@/features/images/ui/photo-progress";

const meta = {
  title: "features/images/PhotoProgress",
  component: PhotoProgress,
  args: { label: "写真を読み込んでいます。", place: "top" },
  parameters: { layout: "fullscreen", stage: null },
} satisfies Meta<typeof PhotoProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Top: Story = {};

export const Center: Story = { args: { place: "center" } };
