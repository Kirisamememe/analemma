import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "@/ui/primitives/button";

const meta = {
  title: "primitives/Button",
  component: Button,
  args: { children: "保存する", onPress: fn<() => void>() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { tone: "primary" } };

export const Secondary: Story = { args: { tone: "secondary" } };

export const Quiet: Story = { args: { tone: "quiet" } };

export const Danger: Story = { args: { tone: "danger", children: "削除する" } };

export const Small: Story = { args: { size: "sm" } };

export const IconOnly: Story = {
  args: { children: undefined, icon: "trash-2", "aria-label": "削除する" },
};

export const IconOnlySmall: Story = {
  args: {
    children: undefined,
    icon: "trash-2",
    "aria-label": "削除する",
    size: "sm",
  },
};

export const Pending: Story = { args: { tone: "primary", isPending: true } };

export const Disabled: Story = { args: { tone: "primary", isDisabled: true } };

export const DangerPending: Story = {
  args: { tone: "danger", children: "削除する", isPending: true },
};
