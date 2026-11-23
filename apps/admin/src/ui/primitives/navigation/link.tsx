import type { ToOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Link as AriaLink } from "react-aria-components";

import { Icon, type IconName } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const link = tv({
  base: "rounded-xs text-fg underline underline-offset-2 outline-hidden is-hovered:decoration-2 is-focus-shown:focus-ring",
  variants: {
    withIcon: {
      true: "inline-flex items-center gap-1",
    },
  },
});

/** リンクに渡す値。 */
export type LinkProps = {
  /** 管理画面の中の行き先(TanStack Router の route のパス)。 */
  href: NonNullable<ToOptions["to"]>;
  /** 文言の前に添えるアイコン。 */
  icon?: IconName | undefined;
  /** リンクの文言。 */
  children: ReactNode;
};

/** 管理画面の中を移るリンク(いつも下線を付ける)。 */
export const Link = ({ href, icon, children }: LinkProps): ReactNode => (
  <AriaLink className={link({ withIcon: icon !== undefined })} href={href}>
    {icon !== undefined && <Icon name={icon} />}
    {children}
  </AriaLink>
);
