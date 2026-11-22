import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppShell } from "@/ui/layout/app-shell";
import { Center } from "@/ui/layout/center";
import { Stack } from "@/ui/layout/stack";
import { Text } from "@/ui/layout/text";
import { PageHeader } from "@/ui/patterns/page-header";
import { SideNav } from "@/ui/patterns/side-nav";
import { NavButton } from "@/ui/primitives/navigation/nav-item";

const meta = {
  title: "patterns/SideNav",
  component: SideNav,
  args: {
    appName: "Stilus",
    label: "メイン",
    drawerLabel: "ナビ",
    groups: [
      {
        items: [
          { href: "/", icon: "house", label: "ホーム", isCurrent: false },
        ],
      },
      {
        heading: "設定",
        items: [
          {
            href: "/security",
            icon: "shield-check",
            label: "セキュリティ",
            isCurrent: true,
          },
        ],
      },
    ],
    footer: <NavButton icon="log-out">ログアウト</NavButton>,
  },
  parameters: { layout: "fullscreen", stage: null },
  decorators: [
    (Story) => (
      <AppShell nav={<Story />}>
        <Center width="page">
          <Stack>
            <PageHeader title="セキュリティ" />
            <Text>ログインに使うパスキーとセッションを管理します。</Text>
          </Stack>
        </Center>
      </AppShell>
    ),
  ],
} satisfies Meta<typeof SideNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
