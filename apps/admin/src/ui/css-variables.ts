import type { CSSProperties } from "react";

declare module "react" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- React の型の登録は、interface の宣言のマージでしか書けない
  interface CSSProperties {
    /** 進み具合(0〜1)。 */
    "--progress"?: number;
    /** 写真の縦横比。 */
    "--media-aspect"?: string;
    /** 写真の読み込み中に見せる色。 */
    "--media-color"?: string;
    /** 写真の焦点の横の位置。 */
    "--focal-x"?: string;
    /** 写真の焦点の縦の位置。 */
    "--focal-y"?: string;
  }
}

/** 部品が style で渡してよい CSS 変数の名前。 */
export type CssVariable = Extract<keyof CSSProperties, `--${string}`>;
