import { setPublished } from "@/features/collections/editing/queries/collections.query";
import { toAdminCollection } from "@/features/collections/to-admin-collection";
import { adminProcedures } from "@/procedures";

/** コレクションを公開する procedure。 */
export const publishCollection = adminProcedures.collections.publish.handler(
  async ({ context, errors, input }) => {
    const row = await setPublished(context.db, {
      id: input.id,
      publishedAt: context.clock.now(),
    });

    if (row === undefined) throw errors.NOT_FOUND();

    context.logger.write({
      level: "info",
      message: "コレクションを公開した",
      details: { collectionId: input.id },
    });

    return toAdminCollection(row);
  },
);
