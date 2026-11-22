import {
  CircleAlert,
  CircleCheck,
  House,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

const ICONS = {
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  house: House,
  "shield-check": ShieldCheck,
  "log-out": LogOut,
  menu: Menu,
  x: X,
};

/** 管理画面で使うアイコンの名前。 */
export type IconName = keyof typeof ICONS;

/** アイコンに渡す値。 */
type IconProps = {
  /** アイコンの名前。 */
  readonly name: IconName;
};

/** 文字や操作に添える装飾のアイコン。 */
export const Icon = ({ name }: IconProps): ReactNode => {
  const Glyph = ICONS[name];

  return (
    <Glyph
      aria-hidden="true"
      className="size-icon shrink-0"
      strokeWidth={1.75}
    />
  );
};
