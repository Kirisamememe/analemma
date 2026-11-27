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
      dashed:
        "w-full justify-items-start border-dashed border-line-strong text-start text-fg",
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
      row: "min-h-11 px-3 md:min-h-10",
      card: "min-h-11 px-3 py-2 md:min-h-16",
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
      full: "relative rounded-full pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:rounded-full",
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
  tone?: "primary" | "secondary" | "quiet" | "danger" | "dashed";
  /** 高さ(`sm-to-md` は画面の幅で変わる)。 */
  size?: "row" | "card" | "md" | "sm" | "sm-to-md";
  /** `icon` で指定したアイコンの線の太さ。 */
  iconWeight?: "regular" | "bold";
  /** 角の丸み。 */
  rounded?: "control" | "xs" | "full";
  /** 送信先のフォームの ID。 */
  form?: string | undefined;
  /** フォームを送るボタンか。 */
  type?: "button" | "submit";
  /** 送信中か(押せなくし、待っていることを示す)。 */
  isPending?: boolean;
  /** 押せないか。 */
  isDisabled?: boolean;
  /** 押したときに呼ぶ関数。 */
  onPress?: () => void;
  /** ボタンの要素(focus を移すときに使う)。 */
  ref?: Ref<HTMLButtonElement> | undefined;
  /** ボタンを説明する要素の ID。 */
  "aria-describedby"?: string | undefined;
};

/** 操作のボタン。 */
export const Button = ({
  tone = "secondary",
  size = "md",
  type = "button",
  form,
  isPending = false,
  isDisabled = false,
  onPress,
  ref,
  icon,
  iconWeight = "regular",
  rounded = "control",
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  children,
}: ButtonProps): ReactNode => {
  const { t } = useTranslation();

  const attributes = {
    ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel }),
    ...(describedBy === undefined ? {} : { "aria-describedby": describedBy }),
    ...(form === undefined ? {} : { form }),
  };

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
      // oxlint-disable-next-line project/styling-boundary -- 名前と送信先の指定が無いときは属性を省く。見た目の props は含まない。
      {...attributes}
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
