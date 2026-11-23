import type { Meta, StoryObj } from "@storybook/react-vite";

import { ColorSpecimen } from "@/ui/specimens/color-specimen";

const meta = {
  title: "theme/Colors",
  component: ColorSpecimen,
  parameters: { layout: "padded", stage: null },
} satisfies Meta<typeof ColorSpecimen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LightAndDark: Story = {};
