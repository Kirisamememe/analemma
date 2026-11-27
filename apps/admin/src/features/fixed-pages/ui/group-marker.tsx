import type { ReactNode } from "react";

import { NestLine } from "./nest-line";

import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const marker = tv({
  base: [
    "grid size-7 shrink-0 place-items-center rounded-full @max-3xs/nested-form:size-5",
    "border-2 bg-surface text-fg-muted",
  ],
  variants: { invalid: { true: "border-danger text-danger" } },
});

/** まとまりの見出しの左に置く印に渡す値。 */
type GroupMarkerProps = {
  /** 項目の型。 */
  kind: "group" | "repeat";
  /** 親の group から見出しに枝をつなぐか。 */
  inGroup: boolean;
  /** まとまりに誤りがあるか。 */
  invalid: boolean;
};

/** group と repeat の見出しの左に置く、型のアイコンの丸と、上下へ伸びる線。 */
export const GroupMarker = ({
  kind,
  inGroup,
  invalid,
}: GroupMarkerProps): ReactNode => (
  <div aria-hidden="true" className="flex shrink-0 flex-col items-center">
    {inGroup ? <NestLine shape="lead" /> : <span className="grow" />}
    <div className="relative">
      {inGroup && <NestLine shape="elbowToHeading" />}
      <span className={marker({ invalid })}>
        <Icon
          name={kind === "group" ? "layers" : "list"}
          size="md"
          weight="bold"
        />
      </span>
    </div>
    <span className="grow border-s-2" />
  </div>
);
