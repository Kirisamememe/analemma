import type { Meta, StoryObj } from "@storybook/react-vite";

import { ColorSpecimen } from "../color-specimen";

const meta = {
  title: "theme/Colors",
  component: ColorSpecimen,
} satisfies Meta<typeof ColorSpecimen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LightAndDark: Story = {};
