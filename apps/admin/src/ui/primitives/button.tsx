import type { ReactNode, Ref } from "react";
import { Button as AriaButton, ProgressBar } from "react-aria-components";

import { useTranslation } from "../../i18n/use-translation";
import { tv } from "../tv";
import { typography } from "../typography";
import { Spinner } from "./spinner";

const button = tv({
  base: "inline-flex items-center justify-center gap-2 rounded-control border outline-hidden transition-colors is-hovered:state-hover is-focus-shown:focus-ring is-pressed:state-pressed is-pending:cursor-wait is-disabled:state-disabled",
  variants: {
    tone: {
      primary: "border-transparent bg-primary text-on-primary shadow-control",
      secondary: "border-line bg-surface text-fg shadow-control",
      quiet: "border-transparent text-fg",
      danger:
        "border-transparent bg-danger-strong text-on-danger-strong shadow-control",
    },
    size: {
      md: "h-control px-4",
      sm: "h-control-sm px-3",
    },
  },
});

/** ボタンに渡す値。 */
type ButtonProps = {
  /** 見た目の用途。 */
  readonly tone?: "primary" | "secondary" | "quiet" | "danger";
  /** 高さ。 */
  readonly size?: "md" | "sm";
  /** フォームを送るボタンか。 */
  readonly type?: "button" | "submit";
  /** 送信中か(押せなくし、待っていることを示す)。 */
  readonly isPending?: boolean;
  /** 押せないか。 */
  readonly isDisabled?: boolean;
  /** 押したときに呼ぶ関数。 */
  readonly onPress?: () => void;
  /** ボタンの要素(focus を移すときに使う)。 */
  readonly ref?: Ref<HTMLButtonElement>;
  /** ボタンの文言。 */
  readonly children: ReactNode;
};

/** 操作のボタン。 */
export const Button = ({
  tone = "secondary",
  size = "md",
  type = "button",
  isPending = false,
  isDisabled = false,
  onPress,
  ref,
  children,
}: ButtonProps): ReactNode => {
  const t = useTranslation();

  return (
    <AriaButton
      className={button({
        tone,
        size,
        className: typography({ role: "label" }),
      })}
      isDisabled={isDisabled}
      isPending={isPending}
      onPress={() => onPress?.()}
      ref={ref}
      type={type}
    >
      {isPending && (
        <ProgressBar aria-label={t("ui.pending")} isIndeterminate>
          <Spinner />
        </ProgressBar>
      )}
      {children}
    </AriaButton>
  );
};
