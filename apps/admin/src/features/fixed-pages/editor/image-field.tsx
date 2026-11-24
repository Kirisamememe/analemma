import { type ReactNode, type Ref, useId } from "react";

import { type ImageFieldInput, useImageField } from "./hooks/use-image-field";

import { useImage } from "@/components/images/hooks/use-image";
import { ImagePicker } from "@/components/images/image-picker";
import { QueryContent } from "@/components/query-content";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { ImageThumbnail } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

type SelectedImageProps = {
  /** 選んだ画像。 */
  id: string;
  /** 再試行ボタンの参照。 */
  retryRef: Ref<HTMLButtonElement>;
};

const SelectedImage = ({ id, retryRef }: SelectedImageProps): ReactNode => {
  const query = useImage(id);
  const t = useTranslate();

  return (
    <QueryContent
      query={query}
      retryRef={retryRef}
      failedTitle={t("imageDetail.loadFailed")}
      level={3}
      loading="list"
    >
      {(result) =>
        result._tag === "Failed" ? (
          <Text>{t("fixedPageEditor.missingImage")}</Text>
        ) : (
          <Cluster gap={2}>
            <ImageThumbnail
              alt={result.data.alt}
              src={result.data.deliveryImages[0]?.url}
            />
            <Text>
              {result.data.title ??
                result.data.alt ??
                t("imageDetail.untitled")}
            </Text>
            {!result.data.published && (
              <Badge tone="neutral">{t("images.unpublished")}</Badge>
            )}
          </Cluster>
        )
      }
    </QueryContent>
  );
};

type ImageFieldProps = ImageFieldInput & {
  /** 項目のラベル。 */
  label: string;
  /** 必須の項目か。 */
  required: boolean;
  /** 操作する項目と、そこまでの group や repeat の要素名。 */
  target: string;
};

/** 固定ページで画像を1枚選ぶ項目。 */
export const ImageField = (props: ImageFieldProps): ReactNode => {
  const { label, required, target, value } = props;
  const t = useTranslate();

  const { open, trigger, retryRef, error, choose, remove, confirm, close } =
    useImageField(props);

  const errorId = useId();

  const chooseLabel = t(
    value === null
      ? "fixedPageEditor.chooseImage"
      : "fixedPageEditor.replaceImage",
  );

  const removeLabel = t("fixedPageEditor.removeImage");

  const actionName = (action: string) =>
    t("fixedPageEditor.imageAction", { action, target });

  return (
    <fieldset
      data-invalid={error === undefined ? undefined : true}
      aria-describedby={error === undefined ? undefined : errorId}
    >
      <legend>
        <Text as="span" variant="label">
          {label}
        </Text>
        {required && (
          <>
            {" "}
            <Badge tone="danger" variant="soft">
              {t("ui.required")}
            </Badge>
          </>
        )}
      </legend>
      <Stack gap={1.5}>
        <Cluster gap={2}>
          <Button
            ref={trigger}
            aria-label={actionName(chooseLabel)}
            aria-describedby={error === undefined ? undefined : errorId}
            onPress={choose}
          >
            {chooseLabel}
          </Button>
          {value !== null && !required && (
            <Button aria-label={actionName(removeLabel)} onPress={remove}>
              {removeLabel}
            </Button>
          )}
        </Cluster>
        {error !== undefined && (
          <div role="alert" id={errorId}>
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          </div>
        )}
        {value !== null && <SelectedImage id={value} retryRef={retryRef} />}
      </Stack>
      {open && (
        <ImagePicker mode="single" onConfirm={confirm} onClose={close} />
      )}
    </fieldset>
  );
};
