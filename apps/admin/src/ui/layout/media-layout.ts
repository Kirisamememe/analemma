import { tv } from "@/ui/tv";

/** 写真と情報を並べ、狭い画面では情報を写真の下に置く。 */
export const mediaLayout = tv({
  slots: {
    body: "flex grow flex-col md:min-h-0 md:flex-row",
    stage:
      "relative flex items-center justify-center md:min-h-0 md:min-w-0 md:grow md:p-6",
    panel: [
      "flex flex-col gap-6 separator-t bg-surface p-6",
      "md:w-88 md:shrink-0 md:overflow-y-auto md:separator-s",
    ],
  },
})();
