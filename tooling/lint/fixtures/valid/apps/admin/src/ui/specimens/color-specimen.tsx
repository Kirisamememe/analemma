import { tv } from "../tv";

const swatch = tv({
  base: "size-control rounded-control outline -outline-offset-1 outline-fg/10",
  variants: {
    color: {
      focus: "bg-focus",
      line: "bg-line",
      "line-strong": "bg-line-strong",
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
    <span className={swatch({ color: "line-strong" })} />
    <span className={swatch({ color: "on-primary" })} />
    <span className={swatch({ color: "on-danger-strong" })} />
  </>
);
