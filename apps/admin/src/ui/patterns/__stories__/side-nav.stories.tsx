import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppShell, Center, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns/page-header";
import { SideNav } from "@/ui/patterns/side-nav";
import { NavButton, NavSelect } from "@/ui/primitives/navigation";

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
    footer: (
      <>
        <NavSelect
          icon="languages"
          label="言語"
          onChange={() => {}}
          options={[
            { value: "en", label: "English", lang: "en" },
            { value: "ja", label: "日本語", lang: "ja" },
            { value: "zh-Hans", label: "简体中文", lang: "zh-Hans" },
          ]}
          value="ja"
        />
        <NavSelect
          icon="monitor"
          label="配色"
          onChange={() => {}}
          options={[
            { value: "system", label: "自動", icon: "monitor" },
            { value: "light", label: "ライト", icon: "sun" },
            { value: "dark", label: "ダーク", icon: "moon" },
          ]}
          value="system"
        />
        <NavButton icon="log-out">ログアウト</NavButton>
      </>
    ),
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
