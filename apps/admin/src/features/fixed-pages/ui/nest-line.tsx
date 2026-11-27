import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const PARENT_COLUMN = [
  "-inset-s-4.75",
  "@max-3xs/nested-form:-inset-s-nested-branch",
]; // 親の丸の中心を通る列

const ELBOW = [
  "absolute top-0 w-4.75 rounded-es-control border-s-2 border-b-2",
  "@max-3xs/nested-form:w-nested-branch",
];

const nestLine = tv({
  base: PARENT_COLUMN,
  variants: {
    shape: {
      gapUnderGroup: "relative block h-4 w-0 border-s-2",
      gapUnderRepeat: "relative block h-6 w-0 border-s-2",
      through: "absolute inset-y-0 border-s-2",
      lead: "relative grow self-start border-s-2",
      elbowToHeading: [
        ...ELBOW,
        "h-3.75 @max-3xs/nested-form:h-nested-heading",
      ],
      elbowToItem: [...ELBOW, "h-5.25 @max-3xs/nested-form:h-nested-item"],
      elbowToAdd: [
        "absolute top-0 h-1/2 w-7.75",
        "@max-3xs/nested-form:w-nested-add",
      ],
    },
  },
});

type NestLineProps = {
  /** 線の形。 */
  shape:
    | "gapUnderGroup"
    | "gapUnderRepeat"
    | "through"
    | "lead"
    | "elbowToHeading"
    | "elbowToItem"
    | "elbowToAdd";
};

/** 入れ子のまとまりの、親の列を通る線と、子へつなぐ枝。 */
export const NestLine = ({ shape }: NestLineProps): ReactNode => (
  <span aria-hidden="true" className={nestLine({ shape })}>
    {shape === "elbowToAdd" && (
      <span className="absolute inset-x-0 top-0 -bottom-px rounded-es-control border-s-2 border-b-2" />
    )}
  </span>
);
