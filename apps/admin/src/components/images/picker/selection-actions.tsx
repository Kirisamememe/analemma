import { type ReactNode, type Ref, useSyncExternalStore } from "react";

import type { useImageSelection } from "../hooks/use-image-selection";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { ModalActions } from "@/ui/primitives/overlays";

type Selection = ReturnType<typeof useImageSelection>;

/** 選択の取り消しと確定の操作に渡す値。 */
type SelectionActionsProps = Pick<Selection, "confirm" | "count"> &
  Pick<Selection["source"], "subscribe"> & {
    /** キャンセルボタンへの参照。 */
    cancel: Ref<HTMLButtonElement>;
    /** 選択を取り消す。 */
    onClose: () => void;
    /** 選んだ画像を送っているか。 */
    pending: boolean;
  };

/** 選択の取り消しと確定の操作。 */
export const SelectionActions = ({
  subscribe,
  confirm,
  count,
  cancel,
  onClose,
  pending,
}: SelectionActionsProps): ReactNode => {
  const t = useTranslate();
  const selected = useSyncExternalStore(subscribe, count);

  return (
    <ModalActions>
      <Button tone="quiet" isDisabled={pending} ref={cancel} onPress={onClose}>
        {t("imageDetail.cancel")}
      </Button>
      <Button
        isPending={pending}
        tone="primary"
        isDisabled={selected === 0}
        onPress={confirm}
      >
        {t("imagePicker.confirm")}
      </Button>
    </ModalActions>
  );
};
