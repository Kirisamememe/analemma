import type { MouseEvent, ReactNode, Ref } from "react";
import { Link as AriaLink } from "react-aria-components";

import { Icon } from "@/ui/primitives/graphics";
import type { AppHref } from "@/ui/primitives/ui-provider";
import { tv } from "@/ui/tv";

const link = tv({
  base: "rounded-xs outline-hidden is-focus-shown:focus-ring",
  variants: {
    variant: {
      inline: "text-fg underline underline-offset-2 is-hovered:decoration-2",
      forward:
        "inline-flex min-w-0 items-center gap-1 text-fg is-hovered:underline",
      back: "inline-flex items-center gap-1 text-fg-muted transition is-hovered:text-fg",
      block: "group block rounded-control transition is-pressed:state-pressed",
    },
  },
});

const chevron = tv({
  base: "-ml-1.5 flex",
});

/** リンクに渡す値。 */
export type LinkProps = {
  /** 管理画面の中の行き先(route のパスか、その `$id` などに値を入れたもの)。 */
  href: AppHref;
  /** 取得を待つ間も focus を保つリンクの移動方法。 */
  navigation?: {
    /** 一時的に移動できないか。 */
    disabled: boolean;
    /** 通常のクリックで同じタブに行き先を開く。 */
    open: () => void;
  };
  /** 見た目(文の中のリンクか、前後の画面へ移るリンクか、写真と文字のような中身を包むリンクか)。 */
  variant?: "inline" | "back" | "forward" | "block";
  /** リンクの中身(文言か、包む中身)。 */
  children: ReactNode;
  /** リンクの要素(focus を移すときに使う)。 */
  ref?: Ref<HTMLAnchorElement> | undefined;
};

/** 管理画面の中を移るリンク。 */
export const Link = ({
  href,
  navigation,
  variant = "inline",
  children,
  ref,
}: LinkProps): ReactNode => {
  if (navigation !== undefined) {
    const open = (event: MouseEvent<HTMLAnchorElement>): void => {
      if (
        navigation.disabled ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      navigation.open();
    };

    return (
      <a
        aria-disabled={navigation.disabled || undefined}
        className={link({
          variant,
          className: navigation.disabled
            ? "focus-visible:focus-ring"
            : "focus-visible:focus-ring active:state-pressed",
        })}
        href={navigation.disabled ? undefined : href}
        ref={ref}
        role={navigation.disabled ? "link" : undefined}
        tabIndex={0}
        onClick={open}
      >
        {children}
      </a>
    );
  }

  return (
    <AriaLink className={link({ variant })} href={href} ref={ref}>
      {variant === "back" && (
        <span className={chevron()}>
          <Icon name="chevron-left" />
        </span>
      )}
      {children}
      {variant === "forward" && <Icon name="chevron-right" size="sm" />}
    </AriaLink>
  );
};
