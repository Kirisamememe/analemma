import { setPublished } from "@/features/collections/editing/queries/collections.query";
import { toAdminCollection } from "@/features/collections/to-admin-collection";
import { adminProcedures } from "@/procedures";

/** コレクションを非公開にする procedure。 */
export const unpublishCollection =
  adminProcedures.collections.unpublish.handler(
    async ({ context, errors, input }) => {
      const row = await setPublished(context.db, {
        id: input.id,
        publishedAt: null,
      });

      if (row === undefined) throw errors.NOT_FOUND();

      context.logger.write({
        level: "info",
        message: "コレクションを非公開にした",
        details: { collectionId: input.id },
      });

      return toAdminCollection(row);
    },
  );
