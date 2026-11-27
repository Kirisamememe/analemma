import { type ReactNode, type Ref, useCallback, useRef } from "react";

import {
  type PickerSelection,
  useImageSelection,
} from "./hooks/use-image-selection";
import {
  ChoiceConditionsContext,
  SelectionSourceContext,
} from "./image-choice-context";
import { ImagesSection } from "./images-section";
import { ImageChoice } from "./picker/image-choice";
import { SelectionActions } from "./picker/selection-actions";
import { SelectionStatus } from "./picker/selection-status";

import { useTranslate } from "@/i18n/use-translate";
import type { ImageSummary } from "@/queries/images-query";
import { Modal, ModalSection } from "@/ui/primitives/overlays";

type ImagePickerProps = PickerSelection & {
  /** 選択を取り消す。 */
  onClose: () => void;
};

const renderChoice = (
  image: ImageSummary,
  focus: Ref<HTMLInputElement>,
): ReactNode => <ImageChoice image={image} focus={focus} />;

/** 画像の一覧から1枚または複数枚を選ぶ Dialog。 */
export const ImagePicker = (props: ImagePickerProps): ReactNode => {
  const t = useTranslate();
  const cancel = useRef<HTMLButtonElement>(null);
  const { isPending = false, onClose } = props;
  const selection = useImageSelection(props);
  const { source, conditions, count, confirm } = selection;

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Modal
      isPending={isPending}
      isOpen
      width="page"
      footer={{
        start: <SelectionStatus selection={selection} />,
        end: (
          <SelectionActions
            cancel={cancel}
            onClose={onClose}
            pending={isPending}
            subscribe={source.subscribe}
            count={count}
            confirm={confirm}
          />
        ),
      }}
      onOpenChange={onOpenChange}
      title={t("imagePicker.title")}
    >
      <SelectionSourceContext value={source}>
        <ChoiceConditionsContext value={conditions}>
          <ModalSection>
            <ImagesSection
              singleChoice={source.mode === "single"}
              fallbackFocus={cancel}
              renderChoice={renderChoice}
            />
          </ModalSection>
        </ChoiceConditionsContext>
      </SelectionSourceContext>
    </Modal>
  );
};
