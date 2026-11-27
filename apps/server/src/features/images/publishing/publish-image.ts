import { setPublished } from "@/features/images/publishing/queries/set-published.query";
import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { findImage, lockImage } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 画像を公開する procedure。 */
export const publishImage = adminProcedures.images.publish.handler(
  async ({ context, errors, input }) => {
    const change = await context.db.transaction(async (tx) => {
      await lockImage(tx, input.id);

      const deliveryImages = await listDeliveryImages(tx, [input.id]);

      const row = await setPublished(tx, {
        id: input.id,
        published: true,
        now: context.clock.now(),
      });

      if (row !== undefined) return toAdminImage(row, deliveryImages);

      return (await findImage(tx, input.id)) === undefined
        ? "not-found"
        : "not-converted";
    });

    if (change === "not-found") throw errors.NOT_FOUND();

    if (change === "not-converted") throw errors.NOT_CONVERTED();

    context.logger.write({
      level: "info",
      message: "画像を公開した",
      details: { imageId: change.id },
    });

    return change;
  },
);
