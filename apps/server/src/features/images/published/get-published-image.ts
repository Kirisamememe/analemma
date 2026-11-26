import { readPublishedImages } from "@/features/images/published/queries/published-images.query";
import { toPublishedImage } from "@/features/images/to-image";
import { publicProcedures } from "@/procedures";

/** 公開している画像を ID で返す procedure。 */
export const getPublishedImage = publicProcedures.images.get.handler(
  async ({ context, errors, input }) => {
    const rows = await readPublishedImages(context.db, [input.id]);
    const image = toPublishedImage(rows, context.relyingParty.origin);

    if (image === undefined) throw errors.NOT_FOUND();

    return image;
  },
);
