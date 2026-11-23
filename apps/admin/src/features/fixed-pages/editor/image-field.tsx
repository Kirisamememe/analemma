import { type ReactNode, useId } from "react";

import { useImageField } from "./hooks/use-image-field";

import { useImage } from "@/components/images/hooks/use-image";
import { ImagePicker } from "@/components/images/image-picker";
import { QueryContent } from "@/components/query-content";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { ImageThumbnail } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

const SelectedImage = ({ id }: Record<"id", string>): ReactNode => {
  const query = useImage(id);
  const t = useTranslate();

  return (
    <QueryContent
      query={query}
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

type ImageFieldProps = {
  /** 項目のラベル。 */
  label: string;
  /** 必須の項目か。 */
  required: boolean;
  /** server が断った誤り。 */
  error: string | undefined;
  /** フォームが保持する画像の ID。 */
  value: string | null;
  /** 画像の変更をフォームに渡す。 */
  onChange: (value: string | null) => void;
};

/** 固定ページで画像を1枚選ぶ項目。 */
export const ImageField = ({
  label,
  required,
  error,
  value,
  onChange,
}: ImageFieldProps): ReactNode => {
  const t = useTranslate();

  const { open, trigger, choose, remove, confirm, close } = useImageField(
    value,
    onChange,
  );

  const errorId = useId();

  return (
    <fieldset aria-describedby={error === undefined ? undefined : errorId}>
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
        {value !== null && <SelectedImage id={value} />}
        <div data-invalid={error === undefined ? undefined : true}>
          <Cluster gap={2}>
            <Button
              ref={trigger}
              aria-describedby={error === undefined ? undefined : errorId}
              onPress={choose}
            >
              {t(
                value === null
                  ? "fixedPageEditor.chooseImage"
                  : "fixedPageEditor.replaceImage",
              )}
            </Button>
            {value !== null && !required && (
              <Button onPress={remove}>
                {t("fixedPageEditor.removeImage")}
              </Button>
            )}
          </Cluster>
        </div>
        {error !== undefined && (
          <div role="alert" id={errorId}>
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          </div>
        )}
      </Stack>
      {open && (
        <ImagePicker mode="single" onConfirm={confirm} onClose={close} />
      )}
    </fieldset>
  );
};
