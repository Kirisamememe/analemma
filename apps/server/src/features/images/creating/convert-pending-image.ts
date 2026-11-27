import type { AppContext } from "@/context";
import { insertDeliveryImages } from "@/features/images/creating/queries/image-registration.query";
import { markConverted } from "@/features/images/creating/queries/pending-image.query";
import { storeDeliveryImages } from "@/features/images/creating/store-delivery-images";
import { createDeliveryImages } from "@/features/images/processing/create-delivery-images";
import type { AvifImage } from "@/platform/images/encode-avif";

type ConversionContext = Pick<AppContext, "conversions" | "pending">;

type PublishingContext = Pick<
  AppContext,
  "clock" | "db" | "pending" | "storage"
>;

/** 変換を待つ画像の原本から、順番を待って配信用の画像を作る。 */
export const createPendingDelivery = async (
  { conversions, pending }: ConversionContext,
  imageId: string,
) =>
  conversions.run(async () => {
    if (pending.isStopping()) return "stopped";

    const bytes = await pending.read(imageId);

    return bytes === undefined
      ? "original-missing"
      : createDeliveryImages(bytes);
  });

/** 作った配信用の画像を登録して、変換を待つ画像を公開にし、原本を消す。 */
export const publishPendingImage = async (
  { clock, db, pending, storage }: PublishingContext,
  {
    imageId,
    images,
  }: Record<"imageId", string> & Record<"images", readonly AvifImage[]>,
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
