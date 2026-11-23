import { mediaLayout } from "@/ui/layout/media-layout";
import { tv } from "@/ui/tv";

const viewer = tv({
  slots: {
    root: "flex min-h-dvh flex-col bg-canvas scheme-dark md:h-dvh",
    bar: [
      "sticky top-0 z-sticky short-viewport:static",
      "flex h-nav-bar shrink-0 items-center justify-between gap-3",
      "border-b bg-surface px-4",
    ],
    actions: "flex items-center gap-2",
    content: "flex min-h-0 grow flex-col",
    body: mediaLayout.body(),
    stage: [
      mediaLayout.stage(),
      "group",
      "touch-pan-y touch-pinch-zoom", // 横の動きはスワイプに使い、縦の scroll と拡大は残す
    ],
    progress: [
      "absolute top-4 flex items-center gap-2",
      "rounded-surface bg-surface px-4 py-2",
      "pointer-events-none loading-state-animation forced-colors:hidden",
    ],
    missing: [
      "flex aspect-photo w-full flex-col items-center justify-center gap-2",
      "text-fg-muted md:w-auto md:max-w-md",
    ],
    side: [
      "absolute inset-y-0 flex items-center px-3",
      "opacity-0 transition focus-within:opacity-100 pointer-fine:group-hover:opacity-100",
    ],
    previous: "left-0",
    next: "right-0",
    control: [
      "flex size-control items-center justify-center rounded-full",
      "bg-scrim/60 text-on-media outline outline-fg/20", // 暗い地の上でも写真の上でも、縁が見える
      "transition group-is-hovered:bg-scrim",
      "group-is-focus-shown:bg-scrim group-is-focus-shown:outline-2 group-is-focus-shown:-outline-offset-2 group-is-focus-shown:outline-current",
    ],
    panel: [mediaLayout.panel(), "focus-visible:focus-ring-inset"],
    message: "flex grow items-center justify-center p-6",
  },
  variants: {
    controlsVisible: {
      true: { side: "opacity-100" },
      false: { side: "pointer-coarse:pointer-events-none" },
    },
  },
});

export const viewerStyle = viewer();
