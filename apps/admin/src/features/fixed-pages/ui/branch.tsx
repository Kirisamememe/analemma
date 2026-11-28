import type { ReactNode } from "react";

import { branchLines } from "./logic/branch-lines";
import { NestLine } from "./nest-line";

import { Text } from "@/ui/layout";
import { tv } from "@/ui/tv";

const branch = tv({
  base: "relative",
  variants: { add: { true: "flex ps-3 @max-3xs/nested-form:ps-1" } },
});

type BranchProps = {
  /** 線を引く親のまとまり。 */
  parent: "group" | "repeat";
  /** 枝をつなぐ先。 */
  target?: "heading" | "item" | "add" | undefined;
  /** 親の最後の子か。 */
  isLast?: boolean;
  /** 追加のボタンの下に出して、読み上げにも知らせる補足。 */
  note?: string | undefined;
  /** 線の横に置く中身。 */
  children: ReactNode;
};

/** 中身の一区間を通る線と、見出しや追加ボタンへの枝。 */
export const Branch = ({
  parent,
  target,
  isLast = false,
  note,
  children,
}: BranchProps): ReactNode => {
  const lines = branchLines({ parent, target, isLast });

  return (
    <div>
      <NestLine shape={lines.gap} />
      <div className={branch({ add: target === "add" })}>
        {lines.beside.map((shape) => (
          <NestLine key={shape} shape={shape} />
        ))}
        {children}
      </div>
      {target === "add" && (
        <output className="block">
          {note !== undefined && (
            <span className="block ps-3 pt-1.5 @max-3xs/nested-form:ps-1">
              <Text as="span" tone="muted" variant="caption">
                {note}
              </Text>
            </span>
          )}
        </output>
      )}
    </div>
  );
};
