import { updateImageText } from "@/features/images/editing/queries/update-image.query";
import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 画像のタイトル・説明・alt を書き換える procedure。 */
export const updateImage = adminProcedures.images.update.handler(
  async ({ context, errors, input }) => {
    const deliveryImages = await listDeliveryImages(context.db, [input.id]);

    const row = await updateImageText(context.db, {
      id: input.id,
      title: input.title,
      description: input.description,
      alt: input.alt,
      now: context.clock.now(),
    });

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "画像を書き換えた",
      details: { imageId: row.id },
    });

    return toAdminImage(row, deliveryImages);
  },
);
