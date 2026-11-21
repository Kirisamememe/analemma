import { tv } from "tailwind-variants";

/** 文字の役割に、決めていない組を書く。 */
export const text = tv({
  variants: {
    role: {
      body: "text-sm/5",
      lead: "text-lg/lg",
      medium: "font-500",
    },
  },
});
