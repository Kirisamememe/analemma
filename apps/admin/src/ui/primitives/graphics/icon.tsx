import {
  Check,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  CloudAlert,
  FileText,
  GripVertical,
  House,
  KeyRound,
  LogOut,
  Menu,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const ICONS = {
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  "cloud-alert": CloudAlert,
  "file-text": FileText,
  "grip-vertical": GripVertical,
  house: House,
  "key-round": KeyRound,
  "shield-check": ShieldCheck,
  "log-out": LogOut,
  menu: Menu,
  "trash-2": Trash2,
  x: X,
};

/** 管理画面で使うアイコンの名前。 */
export type IconName = keyof typeof ICONS;

const icon = tv({
  base: "shrink-0",
  variants: {
    size: {
      xs: "size-icon-xs",
      sm: "size-icon-sm",
      md: "size-icon",
      lg: "size-icon-lg",
      xl: "size-icon-xl",
    },
  },
});

const STROKE_WIDTHS = { xs: 2, sm: 2, md: 1.75, lg: 1.5, xl: 1.5 } as const; // viewBox(24)の中の太さ。描くと 1〜1.5px

/** アイコンに渡す値。 */
type IconProps = {
  /** アイコンの名前。 */
  name: IconName;
  /** 大きさ(12・14・16・20・24px)。 */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

/** 文字や操作に添える装飾のアイコン。 */
export const Icon = ({ name, size = "md" }: IconProps): ReactNode => {
  const Glyph = ICONS[name];

  return (
    <Glyph
      aria-hidden="true"
      className={icon({ size })}
      strokeWidth={STROKE_WIDTHS[size]}
    />
  );
};
