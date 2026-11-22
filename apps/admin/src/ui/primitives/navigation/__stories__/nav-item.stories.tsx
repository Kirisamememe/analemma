import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "../../../layout/stack";
import { NavButton, NavLink } from "../nav-item";

const meta = {
  title: "primitives/NavItem",
  parameters: { stage: "fill" },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Link: Story = {
  /** ナビのリンクの見本。 */
  render: () => (
    <NavLink href="/security" icon="shield-check" isCurrent={false}>
      セキュリティ
    </NavLink>
  ),
};

export const CurrentLink: Story = {
  /** 今いる画面のリンクの見本。 */
  render: () => (
    <NavLink href="/security" icon="shield-check" isCurrent>
      セキュリティ
    </NavLink>
  ),
};

export const Button: Story = {
  /** ナビのボタンの見本。 */
  render: () => <NavButton icon="log-out">ログアウト</NavButton>,
};

export const PendingButton: Story = {
  /** 送信中のボタンの見本。 */
  render: () => (
    <NavButton icon="log-out" isPending>
      ログアウト
    </NavButton>
  ),
};

export const Comparison: Story = {
  /** ナビのリンクとボタンの見本。 */
  render: () => (
    <Stack gap={2}>
      <NavLink href="/" icon="house" isCurrent={false}>
        ホーム
      </NavLink>
      <NavLink href="/security" icon="shield-check" isCurrent>
        セキュリティ
      </NavLink>
      <NavButton icon="log-out">ログアウト</NavButton>
      <NavButton icon="log-out" isPending>
        ログアウト
      </NavButton>
    </Stack>
  ),
};
