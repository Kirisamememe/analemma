import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

/** カルーセルの写真・重ねる表示・操作の見た目。 */
export const carouselStyle = tv({
  slots: {
    strip: "flex items-center gap-2 py-1",
    overlay: [
      "pointer-events-none absolute inset-0 grid place-items-center rounded-xs",
      "bg-scrim/60 text-on-media",
    ],
    tile: ["group block h-photo-preview rounded-xs", "outline-hidden"],
    image:
      "block h-full w-auto max-w-none rounded-xs group-focus-visible:focus-ring-inset",
    missing: [
      "flex aspect-photo h-full items-center justify-center gap-2",
      "rounded-xs bg-surface-muted px-2 group-focus-visible:focus-ring-inset",
    ],
    details: "flex items-center justify-between gap-3 px-panel",
    controls: "flex shrink-0 items-center rounded-full bg-surface-muted",
    count: [
      "min-w-10 text-center tabular-nums trim-cap-height",
      typography({ role: "label" }),
    ],
  },
  variants: { selected: { true: { tile: "focus-ring-current" } } },
});
