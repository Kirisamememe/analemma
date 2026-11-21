import type { ReactNode } from "react";

import { typography } from "../typography";

const ROLES = { 1: "page", 2: "section", 3: "section" } as const;

/** 見出しに渡す値。 */
type HeadingProps = {
  /** 見出しの段(h1〜h3)。 */
  readonly level: 1 | 2 | 3;
  /** 文字の役割(既定は段から決める)。 */
  readonly role?: "page" | "section" | "display";
  /** 見出しの中身。 */
  readonly children: ReactNode;
};

/** 段と文字の役割を決めた見出し。 */
export const Heading = ({ level, role, children }: HeadingProps): ReactNode => {
  const Element = `h${level}` as const;

  return (
    <Element className={typography({ role: role ?? ROLES[level] })}>
      {children}
    </Element>
  );
};
