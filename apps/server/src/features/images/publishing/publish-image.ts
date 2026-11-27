import { setPublished } from "@/features/images/publishing/queries/set-published.query";
import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { findImage } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 画像を公開する procedure。 */
export const publishImage = adminProcedures.images.publish.handler(
  async ({ context, errors, input }) => {
    const deliveryImages = await listDeliveryImages(context.db, [input.id]);

    const row = await setPublished(context.db, {
      id: input.id,
      published: true,
      now: context.clock.now(),
    });

    if (row === undefined) {
      throw (await findImage(context.db, input.id)) === undefined
        ? errors.NOT_FOUND()
        : errors.NOT_CONVERTED();
    }

    context.logger.write({
      level: "info",
      message: "画像を公開した",
      details: { imageId: row.id },
    });

    return toAdminImage(row, deliveryImages);
  },
);
