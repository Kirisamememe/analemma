import type { ReactNode } from "react";

import { tv } from "../tv";
import { typography } from "../typography";

const tone = tv({
  variants: {
    tone: {
      default: "",
      muted: "text-fg-muted",
      danger: "text-danger",
    },
  },
});

/** 文に渡す値。 */
type TextProps = {
  /** 文字の役割。 */
  readonly variant?: "body" | "body-long" | "caption" | "label";
  /** 文字の色の用途。 */
  readonly tone?: "default" | "muted" | "danger";
  /** 文にする要素。 */
  readonly as?: "p" | "span" | "div";
  /** 中身の言語(画面と違うときだけ)。 */
  readonly lang?: string;
  /** 文の中身。 */
  readonly children: ReactNode;
};

/** 文字の役割で大きさと太さを決めた文。 */
export const Text = ({
  variant = "body",
  tone: color = "default",
  as: Element = "p",
  lang,
  children,
}: TextProps): ReactNode => (
  <Element
    className={tone({ tone: color, className: typography({ role: variant }) })}
    lang={lang}
  >
    {children}
  </Element>
);
