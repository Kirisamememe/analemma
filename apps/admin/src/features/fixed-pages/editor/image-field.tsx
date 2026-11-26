import { type ReactNode, useId } from "react";

import { ImageFieldPanel } from "../ui/image-field-panel";
import { type ImageFieldInput, useImageField } from "./hooks/use-image-field";

import { useImage } from "@/components/images/hooks/use-image";
import { ImagePicker } from "@/components/images/image-picker";
import { QueryContent } from "@/components/query-content";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Icon } from "@/ui/primitives/graphics";

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
  const query = useImage(value);

  const image =
    query._tag === "Loaded" && query.data._tag === "Succeeded"
      ? query.data.data
      : undefined;

  return (
    <>
      <ImageFieldPanel
        label={label}
        required={required}
        error={error}
        errorId={errorId}
        selected={value !== null}
        image={image}
        status={
          value !== null &&
          !image && (
            <QueryContent
              query={query}
              level={3}
              loading="list"
              retryRef={retryRef}
              failedTitle={t("imageDetail.loadFailed")}
            >
              {() => (
                <Cluster gap={2}>
                  <Icon name="image-off" />
                  <Text>{t("fixedPageEditor.missingImage")}</Text>
                </Cluster>
              )}
            </QueryContent>
          )
        }
        target={target}
        trigger={trigger}
        onChoose={choose}
        onRemove={remove}
      />
      {open && (
        <ImagePicker mode="single" onConfirm={confirm} onClose={close} />
      )}
    </>
  );
};
