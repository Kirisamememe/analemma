import { type ReactNode, useSyncExternalStore } from "react";

import type { useImageSelection } from "../hooks/use-image-selection";

import { ImageSelectionStatus } from "@/components/images/ui/image-selection-status";
import { useTranslate } from "@/i18n/use-translate";

/** 選択の状態の表示に渡す値。 */
type SelectionStatusProps = {
  /** Dialog が持つ選択。 */
  selection: ReturnType<typeof useImageSelection>;
};

/** 選んでいる画像のタイトルか、選んだ枚数。 */
export const SelectionStatus = ({
  selection,
}: SelectionStatusProps): ReactNode => {
  const t = useTranslate();

  const selected = useSyncExternalStore(
    selection.source.subscribe,
    selection.summary,
  );

  const label =
    typeof selected === "number"
      ? t("imagePicker.selected", { count: selected })
      : selected === undefined
        ? t("imagePicker.none")
        : (selected.title ?? t("images.untitled"));

  return <ImageSelectionStatus label={label} />;
};
