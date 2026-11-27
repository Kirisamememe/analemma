import { receivePhoto } from "@/features/images/creating/receive-photo";
import { startPendingConversion } from "@/features/images/creating/run-pending-conversion";
import { isAcceptedPhoto } from "@/features/images/processing/create-delivery-images";
import { adminProcedures } from "@/procedures";

/** 管理画面から送られた写真1枚を受け取り、変換を待つ画像を作る procedure。 */
export const uploadImage = adminProcedures.images.upload.handler(
  async ({ context, errors, input }) => {
    const bytes = new Uint8Array(await input.photo.arrayBuffer());

    if (!(await isAcceptedPhoto(bytes))) {
      throw errors.UNSUPPORTED_FORMAT();
    }

    const image = await receivePhoto(context, bytes);

    startPendingConversion(context, image.id);
    context.logger.write({
      level: "info",
      message: "送られた写真を受け取った",
      details: { imageId: image.id },
    });

    return image;
  },
);
