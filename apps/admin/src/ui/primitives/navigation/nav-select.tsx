import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Select as AriaSelect,
  SelectValue,
} from "react-aria-components";

import { Icon, type IconName } from "@/ui/primitives/graphics";
import { navItem } from "@/ui/primitives/navigation/nav-item-style";
import { ListBoxPopover } from "@/ui/primitives/overlays";
import { typography } from "@/ui/typography";

/** ナビの選択肢の1つ。 */
export type NavSelectOption<Value extends string> = {
  /** 選択肢の値。 */
  readonly value: Value;
  /** 選択肢のラベル。 */
  readonly label: string;
  /** 一覧で、ラベルの前に添えるアイコン。 */
  readonly icon?: IconName | undefined;
  /** ラベルの言語(画面の言語と違う言語で書いたラベルに付ける)。 */
  readonly lang?: string | undefined;
};

/** ナビの選択に渡す値。 */
type NavSelectProps<Value extends string> = {
  /** 何を選ぶか(読み上げる名前と、一覧の見出し)。 */
  label: string;
  /** 行に添えるアイコン。 */
  icon: IconName;
  /** 選択肢。 */
  options: readonly NavSelectOption<Value>[];
  /** 選んでいる値。 */
  value: Value;
  /** 選び直したときに呼ぶ関数。 */
  onChange: (value: Value) => void;
};

/** ナビに置く、今の値を出し、押すと上に選択肢の一覧を開く行。 */
export const NavSelect = <Value extends string>({
  label,
  icon,
  options,
  value,
  onChange,
}: NavSelectProps<Value>): ReactNode => {
  const selected = options.find((option) => option.value === value);

  return (
    <AriaSelect
      aria-label={label}
      onChange={(key) => {
        const next = options.find((option) => option.value === key);

        if (next !== undefined) {
          onChange(next.value);
        }
      }}
      value={value}
    >
      <AriaButton
        className={navItem({
          opensList: true,
          className: typography({ role: "body" }),
        })}
      >
        <Icon name={icon} />
        <SelectValue className="min-w-0 truncate">
          <span lang={selected?.lang}>{selected?.label}</span>
        </SelectValue>
        <span className="ml-auto flex">
          <Icon name="chevrons-up-down" />
        </span>
      </AriaButton>
      <ListBoxPopover heading={label} options={options} placement="top" />
    </AriaSelect>
  );
};
