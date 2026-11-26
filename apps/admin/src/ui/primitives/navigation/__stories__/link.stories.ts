import type { Meta, StoryObj } from "@storybook/react-vite";

import { Link } from "@/ui/primitives/navigation/link";

const meta = {
  title: "primitives/Link",
  component: Link,
  args: { href: "/security", children: "パスキーとセッション" },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Back: Story = {
  args: { href: "/fixed-pages", variant: "back", children: "固定ページの一覧" },
};

export const Forward: Story = { args: { variant: "forward" } };

export const Block: Story = {
  args: { href: "/", variant: "block", children: "写真と文字を包む中身" },
};
