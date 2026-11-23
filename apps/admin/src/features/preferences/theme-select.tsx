import type { ReactNode } from "react";

import { type MessageKey, useTranslate } from "@/i18n/use-translate";
import { type Theme, THEMES } from "@/preferences/theme";
import { useTheme } from "@/preferences/use-theme";
import type { IconName } from "@/ui/primitives/graphics";
import { NavSelect } from "@/ui/primitives/navigation";

/** 配色の選択肢の文言とアイコン。 */
type ThemeChoice = {
  /** 文言の訳のキー。 */
  readonly label: MessageKey;
  /** 行と一覧に添えるアイコン。 */
  readonly icon: IconName;
};

const CHOICES: Readonly<Record<Theme, ThemeChoice>> = {
  system: { label: "preferences.theme.system", icon: "monitor" },
  light: { label: "preferences.theme.light", icon: "sun" },
  dark: { label: "preferences.theme.dark", icon: "moon" },
};

/** ナビに置く、配色(自動・ライト・ダーク)の選択。 */
export const ThemeSelect = (): ReactNode => {
  const t = useTranslate();
  const { theme, changeTheme } = useTheme();

  return (
    <NavSelect
      icon={CHOICES[theme].icon}
      label={t("preferences.theme")}
      onChange={changeTheme}
      options={THEMES.map((value) => ({
        value,
        label: t(CHOICES[value].label),
        icon: CHOICES[value].icon,
      }))}
      value={theme}
    />
  );
};
