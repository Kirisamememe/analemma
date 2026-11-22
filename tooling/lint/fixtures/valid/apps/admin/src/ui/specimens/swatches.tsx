import { tv } from "../tv";

const swatch = tv({
  base: "size-control rounded-control border",
  variants: {
    color: {
      focus: "bg-focus",
      line: "bg-line",
      "on-primary": "bg-on-primary",
      "on-danger-strong": "bg-on-danger-strong",
    },
  },
});

/** 色の見本では、どの色も bg で塗れる。 */
export const Swatches = () => (
  <>
    <span className={swatch({ color: "focus" })} />
    <span className={swatch({ color: "line" })} />
    <span className={swatch({ color: "on-primary" })} />
    <span className={swatch({ color: "on-danger-strong" })} />
  </>
);
