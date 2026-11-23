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
    body: "flex grow flex-col md:min-h-0 md:flex-row",
    stage: [
      "group relative flex items-center justify-center",
      "md:min-h-0 md:min-w-0 md:grow md:p-6",
      "touch-pan-y touch-pinch-zoom", // 横の動きはスワイプに使い、縦の scroll と拡大は残す
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
    panel: [
      "flex flex-col gap-6 border-t bg-surface p-6",
      "md:w-88 md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-l",
      "focus-visible:focus-ring-inset",
    ],
    placeholder:
      "skeleton-animation aspect-photo max-h-full w-full rounded-control bg-surface-muted",
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
