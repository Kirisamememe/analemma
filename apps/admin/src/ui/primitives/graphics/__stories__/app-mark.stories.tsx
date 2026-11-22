import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppMark } from "../app-mark";

const meta = {
  title: "primitives/AppMark",
  component: AppMark,
} satisfies Meta<typeof AppMark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
