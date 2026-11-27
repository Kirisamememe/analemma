import type { ReactNode } from "react";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const tone = tv({
  variants: {
    truncate: { true: "truncate", false: "wrap-anywhere" },
    tone: {
      default: "",
      muted: "text-fg-muted",
      danger: "text-danger",
    },
  },
});

/** Text に渡す値。 */
type TextProps = {
  /** このテキストを説明として参照する ID。 */
  id?: string;
  /** 文字の役割。 */
  variant?: "body" | "body-long" | "caption" | "label";
  /** 文字の色の用途。 */
  tone?: "default" | "muted" | "danger";
  /** 文字を包む要素。 */
  as?: "p" | "span" | "div";
  /** 1行に収め、入りきらない分を省略するか。 */
  truncate?: boolean;
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
  id,
  lang,
  truncate = false,
  children,
}: TextProps): ReactNode => (
  <Element
    className={tone({
      tone: color,
      truncate,
      className: typography({ role: variant }),
    })}
    id={id}
    lang={lang}
  >
    {children}
  </Element>
);
