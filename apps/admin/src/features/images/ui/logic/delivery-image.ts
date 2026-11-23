import type { ApiOutputs } from "@/api/api-types";

/** 配信用の画像(幅の昇順)。 */
export type DeliveryImages =
  ApiOutputs["admin"]["images"]["get"]["deliveryImages"];

const MIN_TILE_ASPECT = 1 / 2;
const MAX_TILE_ASPECT = 5 / 2;
const FALLBACK_ASPECT = 3 / 2; // 配信用の画像が無いときの枠

/** 一覧の枠の縦横比(幅 ÷ 高さ)。 */
export const toTileAspect = (images: DeliveryImages): number => {
  const largest = images.at(-1);

  if (largest === undefined) return FALLBACK_ASPECT;

  return Math.min(
    MAX_TILE_ASPECT,
    Math.max(MIN_TILE_ASPECT, largest.width / largest.height),
  );
};

const NARROW_ROW_REM = 7; // 狭い幅の行の最低の高さ(min-h-28)
const WIDE_ROW_REM = 11; // 広い幅の行の最低の高さ(@md:min-h-44)
const WIDE_FROM = "(min-width: 31rem)"; // 一覧の幅が @md(28rem)を超える画面の幅
const WIDE_GROWTH = 1.2;
const NARROW_GROWTH = 2;

/** 一覧の枠の縦横比から、img の sizes(表示する幅の見込み)を作る。 */
export const toTileSizes = (aspect: number): string => {
  const wide = (WIDE_ROW_REM * WIDE_GROWTH * aspect).toFixed(1);
  const narrow = (NARROW_ROW_REM * NARROW_GROWTH * aspect).toFixed(1);

  return `${WIDE_FROM} ${wide}rem, min(100vw, ${narrow}rem)`;
};

/** 配信用の画像から、img の srcset(幅の記述子を付けた候補の並び)を作る。 */
export const toSrcSet = (images: DeliveryImages): string =>
  images.map(({ url, width }) => `${url} ${String(width)}w`).join(", ");
