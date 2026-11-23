import { memo, type ReactNode, useReducer, useRef } from "react";

import { type DeliveryImages, toSrcSet } from "./logic/delivery-image";
import { nextPhotoLoad, PHOTO_LOADING } from "./logic/photo-load";
import { PhotoProgress } from "./photo-progress";

import { useTranslate } from "@/i18n/use-translate";
import { ErrorState } from "@/ui/patterns";
import { tv } from "@/ui/tv";

const photo = tv({
  slots: {
    frame: [
      "grid w-full place-items-center overflow-clip",
      "md:size-full md:min-h-0 md:min-w-0 md:grid-cols-1 md:grid-rows-1",
    ],
    image: [
      "col-start-1 row-start-1 block",
      "max-h-viewer-photo w-full object-contain short-viewport:max-h-dvh",
      "md:size-full md:max-h-none md:min-h-0 md:min-w-0",
    ],
    error: "col-start-1 row-start-1 max-h-full overflow-y-auto",
  },
  variants: {
    visible: { false: { image: "invisible" } },
    pending: {
      true: { frame: "pointer-events-none invisible absolute inset-0" },
      false: { frame: "relative" },
    },
  },
});

type ViewerPhotoProps = {
  /** 配信する画像の候補。 */
  images: DeliveryImages;
  /** 最小の画像。 */
  smallest: DeliveryImages[number];
  /** 最大の画像。 */
  largest: DeliveryImages[number];
  /** 写真の代替テキスト。 */
  alt: string;
  /** 読み込みを待っている次の写真か。 */
  pending?: boolean;
  /** 写真を送った向き。 */
  direction?: "previous" | "next" | undefined;
  /** 読み込みを待っている写真の ID(`onSettled` に渡す)。 */
  photoId?: string | undefined;
  /** 写真の読み込みが成功または失敗したときに、写真の ID を渡して呼ぶ関数。 */
  onSettled?: ((id: string) => void) | undefined;
};

const ViewerPhotoContent = ({
  images,
  smallest,
  largest,
  alt,
  pending = false,
  direction,
  photoId,
  onSettled,
}: ViewerPhotoProps): ReactNode => {
  const t = useTranslate();

  const [{ status, attempt }, dispatch] = useReducer(
    nextPhotoLoad,
    PHOTO_LOADING,
  );

  const retrySource = useRef<Element | null>(null);

  const settled = (): void => {
    if (photoId !== undefined) onSettled?.(photoId);
  };

  const style = photo({ visible: status === "loaded", pending });

  return (
    <div
      className={style.frame()}
      aria-hidden={pending || undefined}
      inert={pending}
      data-photo-direction={direction}
    >
      <img
        alt={alt}
        className={style.image()}
        data-photo-ready={status === "loaded" || undefined}
        height={largest.height}
        key={attempt}
        onError={() => {
          dispatch("error");
          settled();
        }}
        onLoad={() => {
          dispatch("load");
          settled();
        }}
        ref={(image) => {
          const source = retrySource.current;

          if (image === null || status !== "loaded" || source === null) return;

          retrySource.current = null;

          if (
            document.activeElement === source ||
            (document.activeElement === document.body && !source.isConnected)
          ) {
            image.focus();
          }
        }}
        tabIndex={-1}
        sizes="(min-width: 48rem) calc(100vw - 25rem), 100vw"
        src={smallest.url}
        srcSet={toSrcSet(images)}
        width={largest.width}
      />
      {status === "loading" && (
        <PhotoProgress label={t("imageViewer.loading")} place="center" />
      )}
      {(status === "failed" || status === "retrying") && (
        <div className={style.error()}>
          <ErrorState
            isRetrying={status === "retrying"}
            layout="screen"
            level={2}
            onRetry={() => {
              retrySource.current =
                document.activeElement instanceof HTMLButtonElement
                  ? document.activeElement
                  : null;
              dispatch("retry");
            }}
            title={t("imageViewer.loadFailed")}
          />
        </div>
      )}
    </div>
  );
};

/** 写真と配信中・配信失敗のお知らせ。 */
export const ViewerPhoto = memo(ViewerPhotoContent);
