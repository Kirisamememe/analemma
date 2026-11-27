import type { ReactNode } from "react";

import { useConversionWatch } from "../hooks/use-conversion-watch";
import { isConverted } from "../logic/conversion-results";

import { useTranslate } from "@/i18n/use-translate";
import { Announcement } from "@/ui/patterns";

/** 変換の終わりを見張る部品に渡す値。 */
type ConversionWatchProps = {
  /** 読み込んだ画像のページ。 */
  pages: Parameters<typeof useConversionWatch>[0];
};

/** 変換中の画像を取り直し、変換を終えた結果を読み上げに知らせる。 */
export const ConversionWatch = ({ pages }: ConversionWatchProps): ReactNode => {
  const t = useTranslate();
  const { isWatching, settled, round } = useConversionWatch(pages);

  if (!isWatching && settled.length === 0) return null;

  return (
    <Announcement revision={round}>
      {settled
        .map((image) =>
          t(
            isConverted(image)
              ? "images.announceConverted"
              : "images.announceUnconverted",
            { title: image.title ?? t("images.untitled") },
          ),
        )
        .join(" ")}
    </Announcement>
  );
};
