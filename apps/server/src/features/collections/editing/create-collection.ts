import { insertCollection } from "@/features/collections/editing/queries/collections.query";
import { toAdminCollection } from "@/features/collections/to-admin-collection";
import { adminProcedures } from "@/procedures";

/** 作品集を作る procedure。 */
export const createCollection = adminProcedures.collections.create.handler(
  async ({ context, errors, input }) => {
    const row = await insertCollection(context.db, input);

    if (row === undefined) throw errors.SLUG_TAKEN();

    context.logger.write({
      level: "info",
      message: "作品集を作った",
      details: { collectionId: row.id },
    });

    return toAdminCollection(row);
  },
);
