import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Stack } from "@/ui/layout";
import type { IconName } from "@/ui/primitives/graphics";
import { NavButton } from "@/ui/primitives/navigation/nav-button";
import {
  NavSelect,
  type NavSelectOption,
} from "@/ui/primitives/navigation/nav-select";

const LANGUAGES: readonly NavSelectOption<string>[] = [
  { value: "en", label: "English", lang: "en" },
  { value: "ja", label: "日本語", lang: "ja" },
  { value: "zh-Hans", label: "简体中文", lang: "zh-Hans" },
];

const THEME_ICONS: Readonly<Record<string, IconName>> = {
  system: "monitor",
  light: "sun",
  dark: "moon",
};

const THEMES: readonly NavSelectOption<string>[] = [
  { value: "system", label: "自動", icon: "monitor" },
  { value: "light", label: "ライト", icon: "sun" },
  { value: "dark", label: "ダーク", icon: "moon" },
];

/** 見本の選択に渡す値。 */
type DemoProps = {
  /** 最初に選んでおく値。 */
  initial: string;
};

/** 選び直した値を行に出す、言語の選択。 */
const LanguageSelect = ({ initial }: DemoProps): ReactNode => {
  const [value, setValue] = useState(initial);

  return (
    <NavSelect
      icon="languages"
      label="言語"
      onChange={setValue}
      options={LANGUAGES}
      value={value}
    />
  );
};

/** 選び直した値に合わせてアイコンを替える、配色の選択。 */
const ThemeSelect = ({ initial }: DemoProps): ReactNode => {
  const [value, setValue] = useState(initial);

  return (
    <NavSelect
      icon={THEME_ICONS[value] ?? "monitor"}
      label="配色"
      onChange={setValue}
      options={THEMES}
      value={value}
    />
  );
};

const meta = {
  title: "primitives/NavSelect",
  parameters: { stage: "fill" },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Language: Story = {
  /** 言語の選択の見本(選択肢は、それぞれの言語の字体で描く)。 */
  render: () => <LanguageSelect initial="ja" />,
};

export const Theme: Story = {
  /** 選択肢にアイコンを添えた、配色の選択の見本。 */
  render: () => <ThemeSelect initial="system" />,
};

export const InNav: Story = {
  /** ナビの下の段に、ログアウトのボタンと並べた見本。 */
  render: () => (
    <Stack gap={0.5}>
      <LanguageSelect initial="ja" />
      <ThemeSelect initial="dark" />
      <NavButton icon="log-out">ログアウト</NavButton>
    </Stack>
  ),
};
