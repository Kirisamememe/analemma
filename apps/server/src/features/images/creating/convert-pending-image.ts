import type { AppContext } from "@/context";
import { insertDeliveryImages } from "@/features/images/creating/queries/image-registration.query";
import { markConverted } from "@/features/images/creating/queries/pending-image.query";
import { storeDeliveryImages } from "@/features/images/creating/store-delivery-images";
import type { AvifImage } from "@/platform/images/encode-avif";

type PublishingContext = Pick<
  AppContext,
  "clock" | "db" | "pending" | "storage"
>;

/** 変換を終えた画像と、作った配信用の画像。 */
type ConvertedImage = {
  /** 画像の ID。 */
  readonly imageId: string;
  /** 幅の段ごとの配信用の画像。 */
  readonly images: readonly AvifImage[];
};

/** 作った配信用の画像を登録して、変換を待つ画像を公開にし、原本を消す。 */
export const publishPendingImage = async (
  { clock, db, pending, storage }: PublishingContext,
  { imageId, images }: ConvertedImage,
): Promise<"published" | "image-gone"> => {
  const published = await storeDeliveryImages(
    { db, storage },
    {
      images,
      register: async (tx, files) => {
        const row = await markConverted(tx, { id: imageId, now: clock.now() });

        if (row === undefined) return undefined;

        await insertDeliveryImages(
          tx,
          files.map((file) => ({ imageId, ...file })),
        );

        return { transactionId: row.transactionId, value: true };
      },
    },
  );

  await pending.discard(imageId);

  return published === true ? "published" : "image-gone";
};
