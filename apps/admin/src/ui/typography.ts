import { tv } from "./tv";

/** 文字の役割ごとの、目盛りの組と太さ。 */
export const typography = tv({
  variants: {
    role: {
      body: "text-sm/xl font-normal",
      "body-long": "text-sm/2xl font-normal",
      caption: "text-xs/lg font-normal",
      label: "text-sm/xl font-semibold",
      section: "text-base/2xl font-semibold",
      page: "text-xl/3xl font-bold",
      display: "text-3xl/5xl font-bold",
    },
  },
});

/** 文字の役割。 */
export type TypographyRole = keyof typeof typography.variants.role;
