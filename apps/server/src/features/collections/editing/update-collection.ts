import { replaceCollection } from "@/features/collections/editing/queries/collections.query";
import { toAdminCollection } from "@/features/collections/to-admin-collection";
import { adminProcedures } from "@/procedures";

/** 作品集の名前・slug・説明を書き換える procedure。 */
export const updateCollection = adminProcedures.collections.update.handler(
  async ({ context, errors, input }) => {
    const result = await replaceCollection(context.db, input);

    if (result._tag === "Missing") throw errors.NOT_FOUND();

    if (result._tag === "SlugTaken") throw errors.SLUG_TAKEN();

    context.logger.write({
      level: "info",
      message: "作品集を書き換えた",
      details: { collectionId: input.id },
    });

    return toAdminCollection(result.row);
  },
);
