import type { ReactNode } from "react";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const tone = tv({
  base: "wrap-anywhere",
  variants: {
    tone: {
      default: "",
      muted: "text-fg-muted",
      danger: "text-danger",
    },
  },
});

/** Text に渡す値。 */
type TextProps = {
  /** 文字の役割。 */
  variant?: "body" | "body-long" | "caption" | "label";
  /** 文字の色の用途。 */
  tone?: "default" | "muted" | "danger";
  /** 文字を包む要素。 */
  as?: "p" | "span" | "div";
  /** 中身の言語(画面と違うときだけ)。 */
  lang?: string;
  /** テキストの中身。 */
  children: ReactNode;
};

/** 文字の役割で大きさと太さを決めたテキスト。 */
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
