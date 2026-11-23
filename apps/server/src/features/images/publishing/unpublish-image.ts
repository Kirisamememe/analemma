import { setPublished } from "@/features/images/publishing/queries/set-published.query";
import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { toAdminImage } from "@/features/images/to-admin-image";
import { adminProcedures } from "@/procedures";

/** 画像を非公開にする procedure。 */
export const unpublishImage = adminProcedures.images.unpublish.handler(
  async ({ context, errors, input }) => {
    const deliveryImages = await listDeliveryImages(context.db, [input.id]);

    const row = await setPublished(context.db, {
      id: input.id,
      published: false,
      now: context.clock.now(),
    });

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "画像を非公開にした",
      details: { imageId: row.id },
    });

    return toAdminImage(row, deliveryImages);
  },
);
