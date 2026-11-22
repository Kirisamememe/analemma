import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppShell } from "../../layout/app-shell";
import { Center } from "../../layout/center";
import { Stack } from "../../layout/stack";
import { Text } from "../../layout/text";
import { NavButton } from "../../primitives/navigation/nav-item";
import { PageHeader } from "../page-header";
import { SideNav } from "../side-nav";

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
