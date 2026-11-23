import type { ReactNode, Ref } from "react";
import { Button as AriaButton, ProgressBar } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { Icon, type IconName, Spinner } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const button = tv({
  slots: {
    base: [
      "inline-grid min-h-min place-items-center",
      "border outline-hidden transition",
      "is-hovered:state-hover is-focus-shown:focus-ring is-pressed:state-pressed is-pending:cursor-wait is-disabled:state-disabled",
    ],
    face: "col-start-1 row-start-1 flex items-center gap-2 py-0.5",
    progress: "col-start-1 row-start-1",
  },
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
      "sm-to-md": [
        "relative h-control-sm px-3 whitespace-nowrap md:h-control md:px-4",
        "max-md:after:absolute max-md:after:inset-x-0 max-md:after:-inset-y-2",
      ],
      lg: "h-11 px-4",
    },
    iconOnly: {
      true: "aspect-square px-0",
      false: {
        base: "@max-3xs/nested-form:max-w-full @max-3xs/nested-form:px-1",
        face: "@max-3xs/nested-form:wrap-anywhere",
      },
    },
    rounded: {
      control: "rounded-control",
      xs: "rounded-xs",
      full: "rounded-full",
    },
    isPending: {
      true: { face: "opacity-0" },
    },
  },
  compoundVariants: [
    {
      size: "sm-to-md",
      iconOnly: true,
      class: { base: "max-md:after:-inset-x-2 md:px-0" },
    },
  ],
});

/** ボタンの中身(文言か、アクセシブルな名前を付けたアイコン)。 */
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
  /** 高さ(`sm-to-md` は画面の幅で変わる)。 */
  size?: "lg" | "md" | "sm" | "sm-to-md";
  /** `icon` で指定したアイコンの線の太さ。 */
  iconWeight?: "regular" | "bold";
  /** 角の丸み。 */
  rounded?: "control" | "xs" | "full";
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
  iconWeight = "regular",
  rounded = "control",
  "aria-label": ariaLabel,
  children,
}: ButtonProps): ReactNode => {
  const { t } = useTranslation();
  const labelling = ariaLabel === undefined ? {} : { "aria-label": ariaLabel };

  const style = button({
    tone,
    size,
    iconOnly: icon !== undefined,
    isPending,
    rounded,
  });

  return (
    <AriaButton
      className={style.base({ className: typography({ role: "label" }) })}
      isDisabled={isDisabled}
      isPending={isPending}
      onPress={() => onPress?.()}
      ref={ref}
      type={type}
      // oxlint-disable-next-line project/styling-boundary -- アクセシブルな名前が無いときに属性を省く。見た目の props は含まない。
      {...labelling}
    >
      {isPending && (
        <ProgressBar
          aria-label={t("ui.pending")}
          className={style.progress()}
          isIndeterminate
        >
          <Spinner />
        </ProgressBar>
      )}
      <span className={style.face()}>
        {icon === undefined ? (
          children
        ) : (
          <Icon name={icon} weight={iconWeight} />
        )}
      </span>
    </AriaButton>
  );
};

const createButton = tv({
  base: [
    "flex w-full items-center gap-2 px-3 text-start",
    "rounded-control border border-dashed border-line-strong text-fg",
    "outline-hidden transition is-focus-shown:focus-ring",
    "is-hovered:state-hover is-pressed:state-pressed",
  ],
  variants: {
    card: { true: "min-h-11 md:min-h-16", false: "min-h-11 md:min-h-10" },
  },
});

type ListCreateButtonProps = {
  /** 追加する操作の名前。 */
  children: ReactNode;
  /** 追加を始める関数。 */
  onPress: () => void;
  /** 広い画面でカードの高さに合わせるか。 */
  card?: boolean;
};

/** 一覧の先頭に置く追加のボタン。 */
export const ListCreateButton = ({
  children,
  onPress,
  card = false,
}: ListCreateButtonProps): ReactNode => (
  <AriaButton
    className={createButton({ card, className: typography({ role: "label" }) })}
    onPress={onPress}
    type="button"
  >
    <Icon name="plus" />
    {children}
  </AriaButton>
);
