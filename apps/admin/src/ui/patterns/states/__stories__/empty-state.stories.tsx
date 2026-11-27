import type { Meta, StoryObj } from "@storybook/react-vite";

import { EmptyState } from "@/ui/patterns/states/empty-state";
import { Button } from "@/ui/primitives/button";

const meta = {
  title: "patterns/EmptyState",
  component: EmptyState,
  args: {
    icon: "file-text",
    title: "固定ページはまだありません",
    description: "作った固定ページは、ここに並びます。",
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: { actions: <Button tone="primary">固定ページを作る</Button> },
};

export const TitleOnly: Story = { args: { description: undefined } };
