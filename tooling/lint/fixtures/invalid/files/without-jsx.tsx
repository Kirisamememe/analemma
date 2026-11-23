import type { ReactNode } from "react";

/** 見出しを描く関数の形。 */
export type RenderTitle = (title: string) => ReactNode;

/** 記事の題の最大の長さ。 */
export const TITLE_LIMIT = 80;
