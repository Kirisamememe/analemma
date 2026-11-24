import {
  lockCollection,
  removeImages,
} from "@/features/collections/membership/queries/collection-images.query";
import { adminProcedures } from "@/procedures";

/** 作品集から画像を外す procedure。 */
export const removeCollectionImages =
  adminProcedures.collections.removeImages.handler(
    async ({ context, errors, input }) => {
      await context.db.transaction(async (tx) => {
        if (!(await lockCollection(tx, input.id))) throw errors.NOT_FOUND();

        await removeImages(tx, input);
      });
      context.logger.write({
        level: "info",
        message: "作品集から画像を外した",
        details: { collectionId: input.id },
      });
    },
  );
