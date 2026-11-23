import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "@/ui/primitives/graphics/spinner";

const meta = {
  title: "primitives/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
