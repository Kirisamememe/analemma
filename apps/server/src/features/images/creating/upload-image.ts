import { createImage } from "@/features/images/creating/create-image";
import { adminProcedures } from "@/procedures";

/** 管理画面から送られた写真1枚から、画像を作る procedure。 */
export const uploadImage = adminProcedures.images.upload.handler(
  async ({ context, errors, input, signal }) => {
    const bytes = new Uint8Array(await input.photo.arrayBuffer());
    const result = await createImage({ ...context, signal }, bytes);

    if (result._tag === "UnsupportedFormat") {
      throw errors.UNSUPPORTED_FORMAT();
    }

    context.logger.write({
      level: "info",
      message: "送られた写真から画像を作った",
      details: { imageId: result.image.id },
    });

    return result.image;
  },
);
