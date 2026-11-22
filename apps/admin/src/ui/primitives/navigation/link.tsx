import type { ToOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Link as AriaLink } from "react-aria-components";

import { tv } from "@/ui/tv";

const link = tv({
  base: "rounded-xs text-fg underline underline-offset-2 outline-hidden is-hovered:decoration-2 is-focus-shown:focus-ring",
});

/** リンクに渡す値。 */
export type LinkProps = {
  /** 管理画面の中の行き先(TanStack Router の route のパス)。 */
  href: NonNullable<ToOptions["to"]>;
  /** リンクの文言。 */
  children: ReactNode;
};

/** 管理画面の中を移るリンク(いつも下線を付ける)。 */
export const Link = ({ href, children }: LinkProps): ReactNode => (
  <AriaLink className={link()} href={href}>
    {children}
  </AriaLink>
);
