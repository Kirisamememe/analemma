import type { ReactNode } from "react";

import type { Neighbor } from "./image-viewer";
import { viewerStyle as style } from "./viewer-styles";

import { Icon } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";

/** 写真の左右に重ねる、前後の画像へのリンクに渡す値。 */
type SideLinkProps = {
  /** 移る先。 */
  neighbor: Neighbor;
  /** 表示している写真からこの向きに移る。 */
  onMove: () => void;
  /** 向きのアイコン。 */
  icon: "chevron-left" | "chevron-right";
  /** 置く側。 */
  place: "previous" | "next";
  /** タップで矢印を表示しているか。 */
  controlsVisible: boolean;
};

/** 写真の左右に重ねる、前後の画像へのリンク。 */
export const SideLink = ({
  neighbor: { href, label, attach, onKeyboardNavigate, disabled },
  onMove,
  icon,
  place,
  controlsVisible,
}: SideLinkProps): ReactNode => (
  <span
    className={style.side({ controlsVisible, className: style[place]() })}
    onClickCapture={(event) => {
      if (
        disabled !== true &&
        event.detail === 0 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        onKeyboardNavigate?.();
      }
    }}
  >
    <Link
      href={href}
      variant="block"
      ref={attach}
      navigation={{ disabled: disabled ?? false, open: onMove }}
    >
      <span className={style.control()}>
        <Icon name={icon} size="lg" />
        <span className="sr-only">{label}</span>
      </span>
    </Link>
  </span>
);
