import { tv } from "@/ui/tv";

/** 背後の画面の上に浮かぶパネルの面、影、輪郭。 */
export const overlayPanel = tv({
  base: "bg-surface text-fg shadow-overlay edge-outer",
  variants: { animated: { true: "overlay-panel-animation" } },
});
