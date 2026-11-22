/** 配色の選び方の一覧(`system` は OS の設定に従う)。 */
export const THEMES = ["system", "light", "dark"] as const;

/** 配色の選び方。 */
export type Theme = (typeof THEMES)[number];

const SUPPORTED: ReadonlySet<string> = new Set(THEMES);

/** 値が、配色の選び方かを返す。 */
export const isTheme = (value: string): value is Theme => SUPPORTED.has(value);
