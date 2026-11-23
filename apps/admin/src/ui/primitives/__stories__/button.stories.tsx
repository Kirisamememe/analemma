import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Cluster, Stack } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";

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

export const BoldIcon: Story = {
  name: "Bold Icon (1.5px)",
  args: {
    children: undefined,
    icon: "arrow-up",
    iconWeight: "bold",
    "aria-label": "上へ",
    tone: "quiet",
    size: "sm",
  },
};

export const Pending: Story = { args: { tone: "primary", isPending: true } };

export const Disabled: Story = { args: { tone: "primary", isDisabled: true } };

export const DangerPending: Story = {
  args: { tone: "danger", children: "削除する", isPending: true },
};

export const PendingWidth: Story = {
  /** 送信中でないボタン(上)と送信中のボタン(下)を縦に並べ、幅を見比べる見本。 */
  render: () => (
    <Cluster align="start" gap={6}>
      <Stack align="start" gap={2}>
        <Button tone="primary">保存する</Button>
        <Button isPending tone="primary">
          保存する
        </Button>
      </Stack>
      <Stack align="start" gap={2}>
        <Button>保存する</Button>
        <Button isPending>保存する</Button>
      </Stack>
      <Stack align="start" gap={2}>
        <Button tone="danger">削除する</Button>
        <Button isPending tone="danger">
          削除する
        </Button>
      </Stack>
      <Stack align="start" gap={2}>
        <Button size="sm">保存する</Button>
        <Button isPending size="sm">
          保存する
        </Button>
      </Stack>
      <Stack align="start" gap={2}>
        <Button>
          <Icon name="trash-2" />
          削除する
        </Button>
        <Button isPending>
          <Icon name="trash-2" />
          削除する
        </Button>
      </Stack>
      <Stack align="start" gap={2}>
        <Button aria-label="削除する" icon="trash-2" />
        <Button aria-label="削除する" icon="trash-2" isPending />
      </Stack>
      <Stack align="start" gap={2}>
        <Button aria-label="削除する" icon="trash-2" size="sm" />
        <Button aria-label="削除する" icon="trash-2" isPending size="sm" />
      </Stack>
    </Cluster>
  ),
};
