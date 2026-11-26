import { tv } from "../../tv";

/** 不透明な面を持つ入力欄の枠。 */
export const fieldControl = tv({
  base: "rounded-control border border-line-strong bg-surface is-invalid:border-danger",
});
