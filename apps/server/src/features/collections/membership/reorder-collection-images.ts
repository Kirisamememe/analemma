import {
  lockCollection,
  reorderImages,
} from "@/features/collections/membership/queries/collection-images.query";
import { adminProcedures } from "@/procedures";

/** コレクションの画像を渡した順に並べ直す procedure。 */
export const reorderCollectionImages =
  adminProcedures.collections.reorder.handler(
    async ({ context, errors, input }) => {
      await context.db.transaction(async (tx) => {
        if (!(await lockCollection(tx, input.id))) throw errors.NOT_FOUND();

        if (!(await reorderImages(tx, input))) {
          throw errors.ORDER_MISMATCH();
        }
      });
      context.logger.write({
        level: "info",
        message: "コレクションの画像を並べ直した",
        details: { collectionId: input.id },
      });
    },
  );
