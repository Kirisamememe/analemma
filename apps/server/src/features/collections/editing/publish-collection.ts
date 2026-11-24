import { setPublished } from "@/features/collections/editing/queries/collections.query";
import { toAdminCollection } from "@/features/collections/to-admin-collection";
import { adminProcedures } from "@/procedures";

/** 作品集を公開する procedure。 */
export const publishCollection = adminProcedures.collections.publish.handler(
  async ({ context, errors, input }) => {
    const row = await setPublished(context.db, {
      id: input.id,
      publishedAt: context.clock.now(),
    });

    if (row === undefined) throw errors.NOT_FOUND();

    context.logger.write({
      level: "info",
      message: "作品集を公開した",
      details: { collectionId: input.id },
    });

    return toAdminCollection(row);
  },
);
