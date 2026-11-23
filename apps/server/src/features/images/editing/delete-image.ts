import { deleteImage as deleteImageRow } from "@/features/images/editing/queries/delete-image.query";
import { adminProcedures } from "@/procedures";

/** 画像を消す procedure。 */
export const deleteImage = adminProcedures.images.delete.handler(
  async ({ context, errors, input }) => {
    if (!(await deleteImageRow(context.db, input.id))) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "画像を消した",
      details: { imageId: input.id },
    });
  },
);
