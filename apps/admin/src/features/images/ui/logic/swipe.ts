/** タッチで指を動かした量と時間。 */
export type Stroke = {
  /** 横に動かした量(px、右が正)。 */
  readonly dx: number;
  /** 縦に動かした量(px、下が正)。 */
  readonly dy: number;
  /** 触れてから離すまでの時間(ms)。 */
  readonly duration: number;
};

const MIN_DISTANCE = 48;
const MAX_DURATION = 800; // これより長く触れたままの動きは、スワイプと見なさない
const HORIZONTAL_RATIO = 1.5; // 横の動きが縦の何倍あれば、横のスワイプと見なすか

/** 指の動きから前後への移動方向を求める。 */
export const toSwipe = ({
  dx,
  dy,
  duration,
}: Stroke): "previous" | "next" | undefined => {
  if (duration > MAX_DURATION || Math.abs(dx) < MIN_DISTANCE) return undefined;

  if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return undefined;

  return dx > 0 ? "previous" : "next";
};
