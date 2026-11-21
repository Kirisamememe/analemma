import type { en } from "./messages/en";

/** 英語の訳の形。 */
type English = typeof en;

/** 訳のキー。 */
export type MessageKey = keyof English;

/** 訳の文字列から取り出した、`{name}` の引数の名前。 */
type Placeholders<Text extends string> =
  Text extends `${string}{${infer Name}}${infer Rest}`
    ? Name | Placeholders<Rest>
    : never;

/** 訳に渡す引数。 */
export type MessageParams<Key extends MessageKey> = Readonly<
  Record<Placeholders<English[Key]>, string | number>
>;

/** 訳を引くときに、キーの後ろに渡す引数の並び。 */
export type MessageArgs<Key extends MessageKey> = [
  Placeholders<English[Key]>,
] extends [never]
  ? []
  : [params: MessageParams<Key>];

/** 英語以外の言語の訳(訳していないキーは省ける)。 */
export type Translation = { readonly [Key in MessageKey]?: string };
