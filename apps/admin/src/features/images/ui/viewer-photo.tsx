import { type ReactNode, useRef, useState } from "react";

import { type DeliveryImages, toSrcSet } from "./logic/delivery-image";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { ErrorState } from "@/ui/patterns";
import { Spinner } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const photo = tv({
  slots: {
    frame: "relative grid w-full place-items-center md:size-full",
    image: [
      "col-start-1 row-start-1 block",
      "max-h-dvh w-full object-contain md:size-full md:max-h-none",
    ],
    error: "col-start-1 row-start-1",
    notice: "absolute inset-0 flex items-center justify-center",
    loading: [
      "flex items-center gap-2 rounded-surface bg-surface px-4 py-2",
      "transition-opacity loading-delay starting:opacity-0",
    ],
  },
  variants: { visible: { false: { image: "invisible" } } },
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
};

/** 写真と配信中・配信失敗のお知らせ。 */
export const ViewerPhoto = ({
  images,
  smallest,
  largest,
  alt,
}: ViewerPhotoProps): ReactNode => {
  const t = useTranslate();

  const [status, setStatus] = useState<
    "loading" | "loaded" | "failed" | "retrying"
  >("loading");

  const [attempt, setAttempt] = useState(0);
  const retrySource = useRef<Element | null>(null);
  const style = photo({ visible: status === "loaded" });

  return (
    <div className={style.frame()}>
      <img
        alt={alt}
        className={style.image()}
        height={largest.height}
        key={attempt}
        onError={() => {
          setStatus("failed");
        }}
        onLoad={() => {
          setStatus("loaded");
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
        <div className={style.notice()}>
          <output className={style.loading()}>
            <Spinner />
            <Text as="span">{t("imageViewer.loading")}</Text>
          </output>
        </div>
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
              setStatus("retrying");
              setAttempt((count) => count + 1);
            }}
            title={t("imageViewer.loadFailed")}
          />
        </div>
      )}
    </div>
  );
};
