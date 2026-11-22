import type { Meta, StoryObj } from "@storybook/react-vite";

import { Link } from "../link";

const meta = {
  title: "primitives/Link",
  component: Link,
  args: { href: "/security", children: "パスキーとセッション" },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
