import { updateImageText } from "@/features/images/editing/queries/update-image.query";
import { readImageRelations } from "@/features/images/queries/image-relations.query";
import { lockImage } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 画像のタイトル・説明・alt を書き換える procedure。 */
export const updateImage = adminProcedures.images.update.handler(
  async ({ context, errors, input }) => {
    const image = await context.db.transaction(async (tx) => {
      await lockImage(tx, input.id);

      const relations = await readImageRelations(tx, [input.id]);

      const row = await updateImageText(tx, {
        id: input.id,
        title: input.title,
        description: input.description,
        alt: input.alt,
        now: context.clock.now(),
      });

      return row && toAdminImage(row, relations.get(row.id));
    });

    if (image === undefined) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "画像を書き換えた",
      details: { imageId: image.id },
    });

    return image;
  },
);
