import { tv } from "@/ui/tv";

/** 写真の一覧の行とタイルの見た目。 */
export const rows = tv({
  slots: {
    list: ["flex flex-wrap gap-x-3 gap-y-6", "after:grow-999"],
    item: "flex min-w-0 grow-(--media-aspect) flex-col",
    body: "flex flex-col gap-2",
    frame: [
      "relative aspect-(--media-aspect) w-full overflow-hidden rounded-control bg-surface-muted",
      "min-h-28 @md:max-h-66 @md:min-h-44",
    ],
    photo: "absolute inset-0 size-full object-cover object-focal",
    shade: [
      "pointer-events-none absolute inset-0 bg-scrim/10 opacity-0 transition",
      "group-is-hovered:opacity-100",
    ],
    missing: [
      "absolute inset-0 flex flex-col items-center justify-center gap-1",
      "p-2 text-center text-fg-muted",
    ],
    caption: "flex w-0 min-w-full flex-col",
    heading: "flex min-w-0 flex-wrap items-center gap-2",
    title: "w-8 max-w-fit min-w-0 grow truncate",
    badge: "flex max-w-full min-w-0 wrap-anywhere",
  },
  variants: {
    selectable: {
      true: {
        photo: "object-contain",
        shade: "group-hover:opacity-100",
        title: "group-has-checked:text-success",
      },
    },
    isUntitled: {
      true: { title: "text-fg-muted" },
    },
  },
});
