/** 1を返す。 */
export const one = (): number => 1;

/** 2を返す。 */
export const two = (): number => 2;

/** 名前付き型は関数数に数えない。 */
export type Unit = "one" | "two";

/** 別の名前付き型。 */
export type Label = {
  /** 単位。 */
  readonly unit: Unit;
};
