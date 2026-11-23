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

export const WithIcon: Story = {
  args: {
    href: "/fixed-pages",
    icon: "arrow-left",
    children: "固定ページの一覧",
  },
};
