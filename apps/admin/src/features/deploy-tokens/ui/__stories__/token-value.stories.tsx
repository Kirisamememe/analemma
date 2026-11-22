import type { Meta, StoryObj } from "@storybook/react-vite";

import { TokenValue } from "@/features/deploy-tokens/ui/token-value";

const meta = {
  title: "features/deploy-tokens/TokenValue",
  component: TokenValue,
  args: {
    label: "「本番のデプロイ」のトークン",
    value: "Xq3vR8mN2pL5tY7wK9bZ0c.Vh4sJ6dF8gH1kL3mN5pQ7rS9tU1vW3xY5zA7bC9dE1f",
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof TokenValue>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Issued: Story = {};

export const LongName: Story = {
  args: {
    label:
      "「deploy-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijk」のトークン",
  },
};
