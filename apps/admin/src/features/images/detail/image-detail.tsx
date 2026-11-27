import type { ReactNode } from "react";

import { ImageInfo } from "./image-info";

import type { ApiOutputs } from "@/api/api-types";
import { toImageStatusView } from "@/components/images/logic/image-status";
import {
  ImageViewer,
  type Neighbor,
} from "@/features/images/ui/viewer/image-viewer";
import { useTranslate } from "@/i18n/use-translate";
import type { AppHref } from "@/ui/primitives/ui-provider";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 写真を見る画面に渡す値。 */
type ImageDetailProps = {
  /** 前後の写真の取得に失敗したときの案内。 */
  navigationError?: ReactNode;
  /** 画像を取り直せなかったときの表示。 */
  error?: ReactNode;
  /** 見る画像。 */
  image: Image;
  /** 読み込んでいる次の写真。 */
  pending?: Image | undefined;
  /** 写真や情報の取得を待つ間の案内。 */
  waiting?: string | undefined;
  /** 写真を送った向き。 */
  direction?: "previous" | "next" | undefined;
  /** 次の写真を表示する準備が整ったときに呼ぶ関数。 */
  onSettled?: ((id: string) => void) | undefined;
  /** 前の画像を見る画面(無ければ undefined)。 */
  previous: Neighbor | undefined;
  /** 次の画像を見る画面(無ければ undefined)。 */
  next: Neighbor | undefined;
  /** 前後の画像を見る画面に移る関数(スワイプで移るとき)。 */
  onMove: (href: AppHref) => void;
};

/** 1枚の画像を大きく出し、その情報を添える。 */
export const ImageDetail = ({
  image,
  navigationError,
  error,
  pending,
  waiting,
  direction,
  onSettled,
  previous,
  next,
  onMove,
}: ImageDetailProps): ReactNode => {
  const t = useTranslate();
  const status = toImageStatusView(image.status);

  const altFor = (photo: Image) =>
    photo.alt ?? photo.title ?? t("imageDetail.untitled");

  return (
    <ImageViewer
      photoId={image.id}
      alt={altFor(image)}
      pending={
        pending === undefined
          ? undefined
          : {
              id: pending.id,
              images: pending.deliveryImages,
              alt: altFor(pending),
            }
      }
      direction={direction}
      waiting={waiting}
      onSettled={onSettled}
      images={image.deliveryImages}
      isPending={status.isPending}
      missing={t(status.detail)}
      next={next}
      onSwipe={(side) => {
        const target = side === "previous" ? previous : next;

        if (target !== undefined && target.disabled !== true) {
          onMove(target.href);
        }
      }}
      previous={previous}
    >
      <ImageInfo image={image} navigationError={navigationError} />
      {error}
    </ImageViewer>
  );
};
