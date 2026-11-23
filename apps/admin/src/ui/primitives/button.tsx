import type { ReactNode, Ref } from "react";
import { Button as AriaButton, ProgressBar } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { Icon, type IconName, Spinner } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const button = tv({
  base: "inline-flex items-center justify-center gap-2 rounded-control border outline-hidden transition is-hovered:state-hover is-focus-shown:focus-ring is-pressed:state-pressed is-pending:cursor-wait is-disabled:state-disabled",
  variants: {
    tone: {
      primary: "border-transparent bg-primary text-on-primary shadow-control",
      secondary: "bg-surface text-fg shadow-control",
      quiet: "border-transparent text-fg",
      danger:
        "border-transparent bg-danger-strong text-on-danger-strong shadow-control",
    },
    size: {
      md: "h-control px-4",
      sm: "h-control-sm px-3",
    },
    iconOnly: {
      true: "aspect-square px-0",
    },
  },
});

/** 文言か、アクセシブルな名前を付けたアイコンか、ボタンの中身。 */
type ButtonContent =
  | {
      /** ボタンの文言。 */
      children: ReactNode;
      /** 文言の代わりに出すアイコン(文言と一緒には使わない)。 */
      icon?: undefined;
      /** アクセシブルな名前。 */
      "aria-label"?: string | undefined;
    }
  | {
      /** ボタンの文言(アイコンだけのボタンでは使わない)。 */
      children?: undefined;
      /** 文言の代わりに出すアイコン。 */
      icon: IconName;
      /** アクセシブルな名前(アイコンだけでは名前にならないので必ず付ける)。 */
      "aria-label": string;
    };

/** ボタンに渡す値。 */
type ButtonProps = ButtonContent & {
  /** 見た目の用途。 */
  tone?: "primary" | "secondary" | "quiet" | "danger";
  /** 高さ。 */
  size?: "md" | "sm";
  /** フォームを送るボタンか。 */
  type?: "button" | "submit";
  /** 送信中か(押せなくし、待っていることを示す)。 */
  isPending?: boolean;
  /** 押せないか。 */
  isDisabled?: boolean;
  /** 押したときに呼ぶ関数。 */
  onPress?: () => void;
  /** ボタンの要素(focus を移すときに使う)。 */
  ref?: Ref<HTMLButtonElement>;
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
  icon,
  "aria-label": ariaLabel,
  children,
}: ButtonProps): ReactNode => {
  const { t } = useTranslation();
  const labelling = ariaLabel === undefined ? {} : { "aria-label": ariaLabel };

  return (
    <AriaButton
      className={button({
        tone,
        size,
        iconOnly: icon !== undefined,
        className: typography({ role: "label" }),
      })}
      isDisabled={isDisabled}
      isPending={isPending}
      onPress={() => onPress?.()}
      ref={ref}
      type={type}
      // oxlint-disable-next-line project/styling-boundary -- アクセシブルな名前が無いときに属性を省く。見た目の props は含まない。
      {...labelling}
    >
      {isPending && (
        <ProgressBar aria-label={t("ui.pending")} isIndeterminate>
          <Spinner />
        </ProgressBar>
      )}
      {icon === undefined ? children : <Icon name={icon} />}
    </AriaButton>
  );
};
