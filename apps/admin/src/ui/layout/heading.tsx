import type { ReactNode } from "react";

import { tv } from "../tv";
import { typography } from "../typography";

const heading = tv({ base: "wrap-anywhere" });

const VARIANTS = { 1: "page", 2: "section", 3: "section" } as const;

/** 見出しに渡す値。 */
type HeadingProps = {
  /** 見出しのレベル(h1〜h3)。 */
  readonly level: 1 | 2 | 3;
  /** 文字の役割(既定は見出しのレベルから決める)。 */
  readonly variant?: "page" | "section" | "display";
  /** 見出しの中身。 */
  readonly children: ReactNode;
};

/** 見出しのレベルと文字の役割を決めた見出し。 */
export const Heading = ({
  level,
  variant,
  children,
}: HeadingProps): ReactNode => {
  const Element = `h${level}` as const;

  return (
    <Element
      className={heading({
        className: typography({ role: variant ?? VARIANTS[level] }),
      })}
    >
      {children}
    </Element>
  );
};
