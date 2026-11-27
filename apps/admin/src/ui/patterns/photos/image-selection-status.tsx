import type { ReactNode } from "react";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const status = tv({
  base: [
    "max-w-48 truncate rounded-control bg-surface px-2 py-1 text-fg-muted md:max-w-80",
    typography({ role: "caption" }),
  ],
});

/** フッターで長いタイトルを1行に収め、選択が変わったことを知らせる。 */
export const ImageSelectionStatus = ({
  label,
}: Readonly<Record<"label", string>>): ReactNode => (
  <output className={status()} title={label}>
    {label}
  </output>
);
