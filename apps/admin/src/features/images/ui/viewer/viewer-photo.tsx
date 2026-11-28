import { type ReactNode, useRef, useState } from "react";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { ErrorState, LoadingStatus } from "@/ui/patterns";
import {
  type DeliveryImages,
  toSrcSet,
} from "@/ui/patterns/photos/logic/delivery-image";
import { Spinner } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const ENTER_FROM = { next: "right", previous: "left" } as const; // 次の写真は右から、前の写真は左から入る

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
    notice: "absolute inset-0 flex items-center justify-center",
    loading: [
      "flex items-center gap-2 rounded-surface bg-surface px-4 py-2",
      "transition-opacity loading-delay starting:opacity-0 forced-colors:hidden",
    ],
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
  /** 写真の読み込みが成功または失敗したときに呼ぶ関数。 */
  onSettled?: (() => void) | undefined;
};

/** 写真と配信中・配信失敗のお知らせ。 */
export const ViewerPhoto = ({
  images,
  smallest,
  largest,
  alt,
  pending = false,
  direction,
  onSettled,
}: ViewerPhotoProps): ReactNode => {
  const t = useTranslate();

  const [status, setStatus] = useState<
    "loading" | "loaded" | "failed" | "retrying"
  >("loading");

  const [attempt, setAttempt] = useState(0);
  const retrySource = useRef<Element | null>(null);
  const style = photo({ visible: status === "loaded", pending });
  const hasFailed = status === "failed" || status === "retrying";

  const focusAfterRetry = (image: HTMLImageElement | null): void => {
    const source = retrySource.current;

    if (image === null || status !== "loaded" || source === null) return;

    retrySource.current = null;

    if (
      document.activeElement === source ||
      (document.activeElement === document.body && !source.isConnected)
    ) {
      image.focus();
    }
  };

  const retry = (): void => {
    retrySource.current =
      document.activeElement instanceof HTMLButtonElement
        ? document.activeElement
        : null;
    setStatus("retrying");
    setAttempt((count) => count + 1);
  };

  return (
    <div
      className={style.frame()}
      aria-hidden={pending || undefined}
      inert={pending}
      data-enter-from={direction && ENTER_FROM[direction]}
    >
      <img
        alt={alt}
        className={style.image()}
        data-entered={status === "loaded" || undefined}
        height={largest.height}
        key={attempt}
        onError={() => {
          setStatus("failed");
          onSettled?.();
        }}
        onLoad={() => {
          setStatus("loaded");
          onSettled?.();
        }}
        ref={focusAfterRetry}
        tabIndex={-1}
        sizes="(min-width: 48rem) calc(100vw - 25rem), 100vw"
        src={smallest.url}
        srcSet={toSrcSet(images)}
        width={largest.width}
      />
      {status === "loading" && (
        <div className={style.notice()}>
          <LoadingStatus label={t("imageViewer.loading")} />
          <span aria-hidden="true" className={style.loading()}>
            <Spinner />
            <Text as="span">{t("imageViewer.loading")}</Text>
          </span>
        </div>
      )}
      {hasFailed && (
        <div className={style.error()}>
          <ErrorState
            isRetrying={status === "retrying"}
            layout="screen"
            level={2}
            onRetry={retry}
            title={t("imageViewer.loadFailed")}
          />
        </div>
      )}
    </div>
  );
};
