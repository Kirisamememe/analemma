import { tv } from "./tv";

/** 文字の役割と、目盛りの組と太さの対応。 */
export const text = tv({
  variants: {
    role: {
      body: "text-sm/xl font-normal",
      caption: "text-xs/lg font-normal",
      label: "text-sm/xl font-semibold",
      dialog: "text-lg/2xl font-bold",
      page: "text-xl/3xl font-bold",
      "page-header": "text-2xl/3xl font-bold",
    },
  },
});
