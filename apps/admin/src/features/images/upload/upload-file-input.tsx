import { type ChangeEvent, type ReactNode, useId, useRef } from "react";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import { formatFileSize } from "@/features/images/upload/logic/upload-view";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Stack, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";

const ACCEPTED_TYPES =
  "image/jpeg,image/heic,image/heif,image/png,image/webp,image/avif,.heic,.heif";

type UploadFileInputProps = {
  /** 選んだ写真を受け取る関数。 */
  onFiles: (files: readonly File[]) => void;
  /** 写真を選べない状態か。 */
  isDisabled?: boolean;
};

/** 写真を選ぶボタンと、選べる形式・大きさの説明。 */
export const UploadFileInput = ({
  onFiles,
  isDisabled = false,
}: UploadFileInputProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);

  const pick = (event: ChangeEvent<HTMLInputElement>): void => {
    const { currentTarget } = event;
    const files = Array.from(currentTarget.files ?? []);

    currentTarget.value = "";

    if (files.length > 0) onFiles(files);
  };

  return (
    <>
      <Button
        aria-label={t("imageUpload.choose")}
        aria-describedby={hintId}
        size="card"
        tone="dashed"
        isDisabled={isDisabled}
        onPress={() => input.current?.click()}
      >
        <Icon name="plus" />
        <Stack as="span" gap={1}>
          <Text as="span" variant="label">
            {t("imageUpload.choose")}
          </Text>
          <Text as="span" tone="muted" variant="caption" id={hintId}>
            {t("imageUpload.guide.file", {
              limit: formatFileSize(locale, PHOTO_MAX_BYTES),
            })}
          </Text>
        </Stack>
      </Button>
      <input
        accept={ACCEPTED_TYPES}
        disabled={isDisabled}
        hidden
        multiple
        onChange={pick}
        ref={input}
        type="file"
      />
    </>
  );
};
