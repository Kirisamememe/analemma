import type { ToOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Link as AriaLink } from "react-aria-components";

import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const link = tv({
  base: "rounded-xs outline-hidden is-focus-shown:focus-ring",
  variants: {
    variant: {
      inline: "text-fg underline underline-offset-2 is-hovered:decoration-2",
      back: "inline-flex items-center gap-1 text-fg-muted transition is-hovered:text-fg",
    },
  },
});

const chevron = tv({
  base: "-ml-1.5 flex",
});

/** リンクに渡す値。 */
export type LinkProps = {
  /** 管理画面の中の行き先(TanStack Router の route のパス)。 */
  href: NonNullable<ToOptions["to"]>;
  /** 見た目(文の中のリンクか、前の画面へ戻るリンクか)。 */
  variant?: "inline" | "back";
  /** リンクの文言。 */
  children: ReactNode;
};

/** 管理画面の中を移るリンク。 */
export const Link = ({
  href,
  variant = "inline",
  children,
}: LinkProps): ReactNode => (
  <AriaLink className={link({ variant })} href={href}>
    {variant === "back" && (
      <span className={chevron()}>
        <Icon name="chevron-left" />
      </span>
    )}
    {children}
  </AriaLink>
);
