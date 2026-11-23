import type { en } from "@/i18n/messages/en";

/** 英語以外の言語の訳(訳していないキーは省ける)。 */
export type Translation = { readonly [Key in keyof typeof en]?: string };
