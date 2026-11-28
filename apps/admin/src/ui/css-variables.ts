import type { CSSProperties } from "react";

declare module "react" {
  interface CSSProperties {
    /** 進み具合(0〜1)。 */
    "--progress"?: number;
    /** 写真の縦横比。 */
    "--media-aspect"?: string;
    /** 写真の読み込み中に見せる色。 */
    "--media-color"?: string;
    /** スクロールバーの長さに対するつまみの割合。 */
    "--scroll-thumb-size"?: string;
    /** つまみが動く範囲に対する現在の位置。 */
    "--scroll-thumb-position"?: string;
    /** 縦にスクロールする領域の高さの上限。 */
    "--scroll-view-limit"?: string;
    /** 写真の焦点の横の位置。 */
    "--focal-x"?: string;
    /** 写真の焦点の縦の位置。 */
    "--focal-y"?: string;
  }
}

/** 部品が style で渡してよい CSS 変数の名前。 */
export type CssVariable = Extract<keyof CSSProperties, `--${string}`>;
