import {
  lockCollection,
  appendImages,
} from "@/features/collections/membership/queries/collection-images.query";
import { adminProcedures } from "@/procedures";

/** コレクションの末尾に画像を足す procedure。 */
export const addCollectionImages =
  adminProcedures.collections.addImages.handler(
    async ({ context, errors, input }) => {
      await context.db.transaction(async (tx) => {
        if (!(await lockCollection(tx, input.id))) throw errors.NOT_FOUND();

        if (!(await appendImages(tx, input))) {
          throw errors.NOT_FOUND();
        }
      });
      context.logger.write({
        level: "info",
        message: "コレクションに画像を足した",
        details: { collectionId: input.id },
      });
    },
  );
