import type { AppContext } from "@/context";
import {
  insertImage,
  insertDeliveryImages,
} from "@/features/images/creating/queries/image-registration.query";
import { storeDeliveryImages } from "@/features/images/creating/store-delivery-images";
import { createDeliveryImages } from "@/features/images/processing/create-delivery-images";
import { readShotInfo } from "@/features/images/processing/read-shot-info";
import { toAdminImage } from "@/features/images/to-image";

type ImageContext = Pick<
  AppContext,
  "clock" | "conversions" | "db" | "storage"
>;

/** 写真1枚から撮影の情報を読み、変換を待ってから、配信用の画像を持つ公開の画像を登録する。 */
export const createImage = async (
  { clock, conversions, db, storage }: ImageContext,
  bytes: Uint8Array,
) => {
  const delivery = await conversions.run(async () =>
    createDeliveryImages(bytes),
  );

  if (delivery._tag === "UnsupportedFormat") return delivery;

  const shot = await readShotInfo(bytes);

  const image = await storeDeliveryImages(
    { db, storage },
    {
      images: delivery.images,
      register: async (tx, files) => {
        const row = await insertImage(tx, { shot, now: clock.now() });
        const rows = files.map((file) => ({ imageId: row.id, ...file }));

        await insertDeliveryImages(tx, rows);

        return {
          transactionId: row.transactionId,
          value: toAdminImage(row, rows),
        };
      },
    },
  );

  if (image === undefined) throw new Error("登録した画像がありません");

  return { _tag: "Created", image } as const;
};
