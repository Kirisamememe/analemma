import {
  type ReactNode,
  type Ref,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";

import { useImageChoice } from "./hooks/use-image-choice";
import {
  type PickerSelection,
  useImageSelection,
} from "./hooks/use-image-selection";
import {
  ChoiceConditionsContext,
  SelectionSourceContext,
} from "./image-choice-context";
import { ImagesSection } from "./images-section";

import { useTranslate } from "@/i18n/use-translate";
import type { ImageSummary } from "@/queries/images-query";
import { ImageRadio, ImageSelectionStatus } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Dialog, DialogActions, DialogSection } from "@/ui/primitives/overlays";

type ImagePickerProps = PickerSelection & {
  /** 選択を取り消す。 */
  onClose: () => void;
};

type Selection = ReturnType<typeof useImageSelection>;

type ChoiceProps = {
  /** この入力欄が選ぶ画像。 */
  image: ImageSummary;
  /** ページを読み込んだ後の focus の移動先。 */
  focus: Ref<HTMLInputElement>;
};

const ImageChoice = ({ image, focus }: ChoiceProps): ReactNode => {
  const t = useTranslate();

  const { checked, disabled, group, type, missing, included, onChange } =
    useImageChoice(image);

  if (type === "radio") {
    return (
      <ImageRadio
        checked={checked}
        disabled={disabled}
        name={group}
        ref={focus}
        onChange={onChange}
      />
    );
  }

  return (
    <span>
      <input
        checked={checked}
        disabled={disabled}
        name={group}
        ref={focus}
        type={type}
        onChange={onChange}
      />
      {missing ? t("imageDetail.gone") : included && t("imagePicker.included")}
    </span>
  );
};

const renderChoice = (
  image: ImageSummary,
  focus: Ref<HTMLInputElement>,
): ReactNode => <ImageChoice image={image} focus={focus} />;

type FooterProps = Pick<Selection, "confirm" | "count"> &
  Pick<Selection["source"], "subscribe"> & {
    /** キャンセルボタンへの参照。 */
    cancel: Ref<HTMLButtonElement>;
    /** 選択を取り消す。 */
    onClose: () => void;
    /** 選んだ画像を送っているか。 */
    pending: boolean;
  };

const SelectionActions = ({
  subscribe,
  confirm,
  count,
  cancel,
  onClose,
  pending,
}: FooterProps): ReactNode => {
  const t = useTranslate();
  const selected = useSyncExternalStore(subscribe, count);

  return (
    <DialogActions>
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
    </DialogActions>
  );
};

const SelectionStatus = ({
  selection,
}: Readonly<Record<"selection", Selection>>): ReactNode => {
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
    <Dialog
      isPending={isPending}
      isOpen
      layout="wide"
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
          <DialogSection>
            <ImagesSection
              singleChoice={source.mode === "single"}
              fallbackFocus={cancel}
              renderChoice={renderChoice}
            />
          </DialogSection>
        </ChoiceConditionsContext>
      </SelectionSourceContext>
    </Dialog>
  );
};
