import type { ReactNode, Ref } from "react";
import { Link as AriaLink } from "react-aria-components";

import { Icon } from "@/ui/primitives/graphics";
import type { AppHref } from "@/ui/primitives/ui-provider";
import { tv } from "@/ui/tv";

const link = tv({
  base: "rounded-xs outline-hidden is-focus-shown:focus-ring",
  variants: {
    variant: {
      inline: "text-fg underline underline-offset-2 is-hovered:decoration-2",
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
  /** 見た目(文の中のリンクか、前の画面へ戻るリンクか、写真と文字のような中身を包むリンクか)。 */
  variant?: "inline" | "back" | "block";
  /** リンクの中身(文言か、包む中身)。 */
  children: ReactNode;
  /** リンクの要素(focus を移すときに使う)。 */
  ref?: Ref<HTMLAnchorElement> | undefined;
};

/** 管理画面の中を移るリンク。 */
export const Link = ({
  href,
  variant = "inline",
  children,
  ref,
}: LinkProps): ReactNode => (
  <AriaLink className={link({ variant })} href={href} ref={ref}>
    {variant === "back" && (
      <span className={chevron()}>
        <Icon name="chevron-left" />
      </span>
    )}
    {children}
  </AriaLink>
);
