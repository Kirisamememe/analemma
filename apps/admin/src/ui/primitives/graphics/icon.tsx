import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CloudAlert,
  FileText,
  GripVertical,
  House,
  KeyRound,
  Languages,
  Layers,
  List,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const ICONS = {
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevrons-up-down": ChevronsUpDown,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  "cloud-alert": CloudAlert,
  "file-text": FileText,
  "grip-vertical": GripVertical,
  house: House,
  "key-round": KeyRound,
  languages: Languages,
  layers: Layers,
  list: List,
  "shield-check": ShieldCheck,
  "log-out": LogOut,
  menu: Menu,
  monitor: Monitor,
  moon: Moon,
  plus: Plus,
  sun: Sun,
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

const ICON_PIXELS = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 } as const;

/** アイコンに渡す値。 */
type IconProps = {
  /** アイコンの名前。 */
  name: IconName;
  /** 大きさ(12・14・16・20・24px)。 */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** 線の太さ(bold は、描いた線が 1.5px)。 */
  weight?: "regular" | "bold";
};

/** 文字や操作に添える装飾のアイコン。 */
export const Icon = ({
  name,
  size = "md",
  weight = "regular",
}: IconProps): ReactNode => {
  const Glyph = ICONS[name];

  return (
    <Glyph
      aria-hidden="true"
      className={icon({ size })}
      strokeWidth={
        weight === "bold" ? (1.5 * 24) / ICON_PIXELS[size] : STROKE_WIDTHS[size]
      }
    />
  );
};
