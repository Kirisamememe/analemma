/** 入れ子のまとまりに引く線の形。 */
export type NestShape =
  | "gapUnderGroup"
  | "gapUnderRepeat"
  | "through"
  | "lead"
  | "elbowToHeading"
  | "elbowToItem"
  | "elbowToAdd";

/** 線を引く一区間の、親と、枝をつなぐ先。 */
type BranchPlace = {
  /** 線を引く親のまとまり。 */
  readonly parent: "group" | "repeat";
  /** 枝をつなぐ先。 */
  readonly target: "heading" | "item" | "add" | undefined;
  /** 親の最後の子か。 */
  readonly isLast: boolean;
};

/** 一区間に引く線の形。 */
type BranchLines = {
  /** 上の区間との隙間を通す線。 */
  readonly gap: NestShape;
  /** 中身の横に、上から重ねる線。 */
  readonly beside: readonly NestShape[];
};

/** 一区間に引く線の形を、親と、枝をつなぐ先と、最後の子かどうかから決める。 */
export const branchLines = ({
  parent,
  target,
  isLast,
}: BranchPlace): BranchLines => ({
  gap: parent === "group" ? "gapUnderGroup" : "gapUnderRepeat",
  beside: [
    ...(!isLast || target === undefined ? (["through"] as const) : []),
    ...(target === "item" ? (["elbowToItem"] as const) : []),
    ...(target === "add" ? (["elbowToAdd"] as const) : []),
  ],
});
