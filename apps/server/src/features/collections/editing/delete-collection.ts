import { deleteCollectionRow } from "@/features/collections/editing/queries/collections.query";
import { adminProcedures } from "@/procedures";

/** 作品集を消す procedure。 */
export const deleteCollection = adminProcedures.collections.delete.handler(
  async ({ context, errors, input }) => {
    if (!(await deleteCollectionRow(context.db, input.id))) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "作品集を消した",
      details: { collectionId: input.id },
    });
  },
);
