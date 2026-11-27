import type { ReactNode, Ref } from "react";

import { usePhotoOverlay } from "./hooks/use-photo-overlay";

import { toImageStatusView } from "@/components/images/logic/image-status";
import { useTranslate } from "@/i18n/use-translate";
import type { ImageSummary } from "@/queries/images-query";
import { Cluster, Stack, Text } from "@/ui/layout";
import { toSrcSet } from "@/ui/patterns/photos/logic/delivery-image";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Icon, Spinner } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const preview = tv({
  slots: {
    frame: "grid w-full min-w-0",
    image: [
      "col-start-1 row-start-1 block h-auto min-h-full",
      "max-h-field-photo w-full object-cover",
    ],
    overlay: "flex min-w-0 gap-2",
    controls: "flex items-center gap-2",
    action: "",
    caption: "flex max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
  },
  variants: {
    overPhoto: {
      false: {
        frame: "gap-1.5",
        overlay: "flex-wrap items-center",
        controls: "order-last",
      },
      true: {
        frame: "group overflow-clip rounded-control md:max-w-80",
        overlay: [
          "relative col-start-1 row-start-1 flex min-w-0 flex-col",
          "justify-between gap-2 scheme-dark",
          "motion-safe:transition-opacity motion-safe:duration-normal motion-safe:ease-standard",
          "pointer-events-none opacity-0 group-has-focus-visible:pointer-events-auto group-has-focus-visible:opacity-100",
        ],
        controls: "justify-between p-2",
        action: [
          "rounded-full bg-scrim/60 text-on-media backdrop-blur-media",
          "has-focus-visible:bg-scrim/80 has-focus-visible:focus-ring-inset",
        ],
        caption: [
          "w-full photo-caption-background px-3 pt-4 pb-2 text-on-media",
          "motion-safe:translate-y-1 motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard",
          "motion-safe:group-has-focus-visible:translate-y-0",
        ],
      },
    },
    open: {
      true: {
        overlay: "pointer-events-auto opacity-100",
        caption: "motion-safe:translate-y-0",
      },
    },
  },
});

type ImageFieldPanelProps = {
  /** 項目のラベル。 */
  label: string;
  /** 必須の項目か。 */
  required: boolean;
  /** 入力エラーの文言。 */
  error?: string | undefined;
  /** 入力エラーの ID。 */
  errorId: string;
  /** 画像を選択済みか。 */
  selected: boolean;
  /** 取得できた画像。 */
  image?: ImageSummary | undefined;
  /** 画像の取得状態の案内。 */
  status?: ReactNode;
  /** 操作の対象を表す項目の名前。 */
  target: string;
  /** 画像を選ぶボタンの参照。 */
  trigger?: Ref<HTMLButtonElement>;
  /** 画像一覧を開く操作。 */
  onChoose: () => void;
  /** 項目の画像を外す操作。 */
  onRemove: () => void;
};

/** 写真と、その写真に対する操作を示す入力欄。 */
export const ImageFieldPanel = ({
  label,
  required,
  error,
  errorId,
  selected,
  image,
  status,
  target,
  trigger = null,
  onChoose,
  onRemove,
}: ImageFieldPanelProps): ReactNode => {
  const t = useTranslate();
  const [photo] = image?.deliveryImages ?? [];

  const chooseLabel = t(
    selected ? "fixedPageEditor.replaceImage" : "fixedPageEditor.chooseImage",
  );

  const removeLabel = t("fixedPageEditor.removeImage");

  const actionName = (action: string) =>
    t("fixedPageEditor.imageAction", { action, target });

  const name = image?.title ?? image?.alt ?? t("imageDetail.untitled");
  const { frame, hover, leave, press, reveal, blur, open } = usePhotoOverlay();
  const style = preview({ overPhoto: photo !== undefined, open });

  const chooseButton = selected ? (
    <Button
      ref={trigger}
      tone="quiet"
      size="md"
      rounded="full"
      icon="arrow-left-right"
      aria-label={actionName(chooseLabel)}
      aria-describedby={error === undefined ? undefined : errorId}
      onPress={onChoose}
    />
  ) : (
    <Button
      ref={trigger}
      tone="secondary"
      aria-label={actionName(chooseLabel)}
      aria-describedby={error === undefined ? undefined : errorId}
      onPress={onChoose}
    >
      <Icon name="image" size="sm" />
      {chooseLabel}
    </Button>
  );

  const buttons = (
    <div className={style.controls()}>
      <div className={style.action()} title={chooseLabel}>
        {chooseButton}
      </div>
      {selected && !required && (
        <div className={style.action()} title={removeLabel}>
          <Button
            tone="quiet"
            size="md"
            rounded="full"
            icon="x"
            aria-label={actionName(removeLabel)}
            onPress={onRemove}
          />
        </div>
      )}
    </div>
  );

  const view = image && toImageStatusView(image.status);

  const caption = image && (
    <div className={style.caption()}>
      <div className="line-clamp-2 min-w-0" title={name}>
        <Text variant="label">{name}</Text>
      </div>
      {view?.badge !== undefined && (
        <Badge tone={view.tone} variant="soft">
          {t(view.badge)}
        </Badge>
      )}
    </div>
  );

  return (
    <fieldset
      className="min-w-0"
      data-invalid={error === undefined ? undefined : true}
      aria-describedby={error === undefined ? undefined : errorId}
    >
      <legend className="max-w-full pb-1.5">
        <span className="flex flex-wrap items-center gap-2">
          <Text as="span" variant="label">
            {label}
          </Text>
          {required && (
            <Badge tone="danger" variant="soft">
              {t("ui.required")}
            </Badge>
          )}
        </span>
      </legend>
      <Stack gap={1.5}>
        <div
          className={style.frame()}
          ref={frame}
          onPointerEnter={photo && hover}
          onPointerLeave={photo && leave}
          onPointerDownCapture={photo && press}
          onClickCapture={photo && reveal}
          onBlur={photo && blur}
        >
          {photo && image && (
            <img
              alt={image.alt ?? ""}
              className={style.image()}
              decoding="async"
              height={photo.height}
              sizes="(min-width: 48rem) 20rem, 100vw"
              src={photo.url}
              srcSet={toSrcSet(image.deliveryImages)}
              width={photo.width}
            />
          )}
          {view && !photo && (
            <Cluster>
              {view.isPending ? <Spinner /> : <Icon name="image-off" />}
              <Text variant="caption" tone="muted">
                {t(view.missing)}
              </Text>
            </Cluster>
          )}
          {!photo && status}
          <div className={style.overlay()}>
            {buttons}
            {caption}
          </div>
        </div>
        {error !== undefined && (
          <div role="alert" id={errorId}>
            <Text tone="danger" variant="caption">
              {error}
            </Text>
          </div>
        )}
      </Stack>
    </fieldset>
  );
};
