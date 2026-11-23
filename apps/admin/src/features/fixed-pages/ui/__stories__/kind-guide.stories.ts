import type { Meta, StoryObj } from "@storybook/react-vite";

import { KindGuide } from "@/features/fixed-pages/ui/kind-guide";

const meta = {
  title: "features/fixed-pages/KindGuide",
  component: KindGuide,
  parameters: { stage: "fill" },
} satisfies Meta<typeof KindGuide>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
