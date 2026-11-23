import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { findImage } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 公開しているかによらず、画像を返す procedure。 */
export const getImage = adminProcedures.images.get.handler(
  async ({ context, errors, input }) => {
    const row = await findImage(context.db, input.id);

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    return toAdminImage(row, await listDeliveryImages(context.db, [row.id]));
  },
);
