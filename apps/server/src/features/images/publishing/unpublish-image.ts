import { setPublished } from "@/features/images/publishing/queries/set-published.query";
import { readImageRelations } from "@/features/images/queries/image-relations.query";
import { findImage, lockImage } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 画像を非公開にする procedure。 */
export const unpublishImage = adminProcedures.images.unpublish.handler(
  async ({ context, errors, input }) => {
    const change = await context.db.transaction(async (tx) => {
      await lockImage(tx, input.id);

      const relations = await readImageRelations(tx, [input.id]);

      const row = await setPublished(tx, {
        id: input.id,
        published: false,
        now: context.clock.now(),
      });

      if (row !== undefined) return toAdminImage(row, relations.get(row.id));

      return (await findImage(tx, input.id)) === undefined
        ? "not-found"
        : "not-converted";
    });

    if (change === "not-found") throw errors.NOT_FOUND();

    if (change === "not-converted") throw errors.NOT_CONVERTED();

    context.logger.write({
      level: "info",
      message: "画像を非公開にした",
      details: { imageId: change.id },
    });

    return change;
  },
);
