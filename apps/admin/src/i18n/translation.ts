import type { en } from "./messages/en";

/** 英語以外の言語の訳(訳していないキーは省ける)。 */
export type Translation = { readonly [Key in keyof typeof en]?: string };
