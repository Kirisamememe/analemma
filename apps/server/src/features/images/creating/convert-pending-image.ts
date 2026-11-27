import type { AppContext } from "@/context";
import { insertDeliveryImages } from "@/features/images/creating/queries/image-registration.query";
import {
  markConverted,
  markFailed,
} from "@/features/images/creating/queries/pending-image.query";
import { storeDeliveryImages } from "@/features/images/creating/store-delivery-images";
import { createDeliveryImages } from "@/features/images/processing/create-delivery-images";

/** 変換を待つ画像を変換した結果。 */
export type PendingConversion =
  | "published"
  | "unsupported"
  | "original-missing"
  | "image-gone"
  | "stopped";

type ConversionContext = Pick<
  AppContext,
  "clock" | "conversions" | "db" | "pending" | "storage"
>;

/** 変換を待つ画像の原本から配信用の画像を作り、画像を公開にして、原本を消す。 */
export const convertPendingImage = async (
  { clock, conversions, db, pending, storage }: ConversionContext,
  imageId: string,
): Promise<PendingConversion> => {
  const delivery = await conversions.run(async () => {
    if (pending.isStopping()) return "stopped";

    const bytes = await pending.read(imageId);

    return bytes === undefined
      ? "original-missing"
      : createDeliveryImages(bytes);
  });

  if (delivery === "stopped") return delivery;

  if (
    delivery === "original-missing" ||
    delivery._tag === "UnsupportedFormat"
  ) {
    await markFailed(db, imageId);
    await pending.discard(imageId);

    return delivery === "original-missing" ? delivery : "unsupported";
  }

  const published = await storeDeliveryImages(
    { db, storage },
    {
      images: delivery.images,
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
