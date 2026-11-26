import type { ReactNode } from "react";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { OverlayLayer } from "@/ui/primitives/overlays";
import { overlayPanel } from "@/ui/primitives/overlays/overlay-panel-style";
import { tv } from "@/ui/tv";

const frame = tv({
  base: ["grid place-items-center px-4", "drop-target"],
  variants: {
    page: {
      true: "page-drop-frame md:rounded-surface",
      false: "h-full rounded-surface",
    },
  },
});

type PhotoDropHintProps = {
  /** 写真を重ねるページの本文。 */
  page?: HTMLElement;
};

/** 写真を画面に重ねている間、落とすと追加できることを伝える。 */
export const PhotoDropHint = ({ page }: PhotoDropHintProps): ReactNode => {
  const t = useTranslate();

  return (
    <OverlayLayer container={page}>
      <div className={frame({ page: page !== undefined })}>
        <div
          className={overlayPanel({ className: "rounded-surface px-6 py-4" })}
        >
          <Text variant="label">{t("imageUpload.dropHere")}</Text>
        </div>
      </div>
    </OverlayLayer>
  );
};
