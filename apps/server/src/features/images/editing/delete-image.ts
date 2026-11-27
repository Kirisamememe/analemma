import { deleteImage as deleteImageRow } from "@/features/images/editing/queries/delete-image.query";
import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { lockImage } from "@/features/images/queries/images.query";
import { adminProcedures } from "@/procedures";

/** 画像を、配信用の画像のファイルと一緒に消す procedure。 */
export const deleteImage = adminProcedures.images.delete.handler(
  async ({ context, errors, input }) => {
    const fileKeys = await context.db.transaction(async (tx) => {
      await lockImage(tx, input.id);

      const deliveryImages = await listDeliveryImages(tx, [input.id]);

      return (await deleteImageRow(tx, input.id))
        ? deliveryImages.map(({ fileKey }) => fileKey)
        : undefined;
    });

    if (fileKeys === undefined) {
      throw errors.NOT_FOUND();
    }

    await context.storage.remove(fileKeys);
    await context.pending.discard(input.id);

    context.logger.write({
      level: "info",
      message: "画像を消した",
      details: { imageId: input.id },
    });
  },
);
