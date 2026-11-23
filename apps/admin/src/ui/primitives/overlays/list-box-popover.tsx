import type { ReactNode } from "react";
import { ListBox, ListBoxItem, Popover } from "react-aria-components";

import { Icon, type IconName } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const listBoxPopover = tv({
  slots: {
    popover: [
      "z-overlay w-(--trigger-width) overflow-y-auto overscroll-contain",
      "rounded-control bg-surface text-fg shadow-overlay outline outline-fg/10",
    ],
    heading: "px-3 pt-2 text-fg-muted",
    option: [
      "group flex items-start gap-2",
      "rounded-xs px-2 py-1 text-fg outline-hidden",
      "is-hovered:state-hover is-focus-shown:focus-ring-inset is-pressed:state-pressed is-selected:bg-fg/10",
    ],
    mark: "flex h-5 shrink-0 items-center",
  },
});

const { popover, heading: headingStyle, option, mark } = listBoxPopover();

/** 選択肢の一覧の1つ。 */
export type ListBoxOption = {
  /** 選択肢の値。 */
  readonly value: string;
  /** 選択肢のラベル。 */
  readonly label: string;
  /** ラベルの前に添えるアイコン。 */
  readonly icon?: IconName | undefined;
  /** ラベルの言語(画面の言語と違う言語で書いたラベルに付ける)。 */
  readonly lang?: string | undefined;
};

/** 選択肢の一覧に渡す値。 */
type ListBoxPopoverProps = {
  /** 選択肢。 */
  options: readonly ListBoxOption[];
  /** 開くボタンのどちら側に出すか。 */
  placement?: "bottom" | "top";
  /** 一覧の上に出す見出し(読み上げでは、一覧の名前が伝える)。 */
  heading?: string | undefined;
  /** 押した選択肢の値を受け取る関数。 */
  onOptionPress?: (value: string) => void;
};

/** Select の選択肢の一覧を出す Popover。 */
export const ListBoxPopover = ({
  options,
  placement = "bottom",
  heading,
  onOptionPress,
}: ListBoxPopoverProps): ReactNode => (
  <Popover className={popover()} offset={4} placement={placement}>
    {heading !== undefined && (
      <p
        aria-hidden="true"
        className={typography({ role: "caption", className: headingStyle() })}
      >
        {heading}
      </p>
    )}
    <ListBox
      className="flex flex-col gap-1 p-1 outline-hidden"
      dependencies={[onOptionPress]}
      items={options}
    >
      {({ value, label, icon, lang }) => (
        <ListBoxItem
          className={typography({ role: "body", className: option() })}
          id={value}
          lang={lang}
          onPressStart={(event) => {
            if (event.pointerType === "keyboard") {
              onOptionPress?.(value);
            }
          }}
          onPressUp={(event) => {
            if (event.pointerType !== "keyboard") {
              onOptionPress?.(value);
            }
          }}
          textValue={label}
        >
          {icon !== undefined && (
            <span className={mark()}>
              <Icon name={icon} />
            </span>
          )}
          <span className="min-w-0 grow wrap-anywhere">{label}</span>
          <span
            className={mark({
              className: "opacity-0 group-is-selected:opacity-100",
            })}
          >
            <Icon name="check" />
          </span>
        </ListBoxItem>
      )}
    </ListBox>
  </Popover>
);
