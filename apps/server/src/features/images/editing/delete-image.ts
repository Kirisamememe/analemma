import { deleteImage as deleteImageRow } from "@/features/images/editing/queries/delete-image.query";
import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { adminProcedures } from "@/procedures";

/** 画像を、配信用の画像のファイルと一緒に消す procedure。 */
export const deleteImage = adminProcedures.images.delete.handler(
  async ({ context, errors, input }) => {
    const deliveryImages = await listDeliveryImages(context.db, [input.id]);

    if (!(await deleteImageRow(context.db, input.id))) {
      throw errors.NOT_FOUND();
    }

    await context.storage.remove(deliveryImages.map(({ fileKey }) => fileKey));
    await context.pending.discard(input.id);

    context.logger.write({
      level: "info",
      message: "画像を消した",
      details: { imageId: input.id },
    });
  },
);
