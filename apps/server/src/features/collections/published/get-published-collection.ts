import { readPublishedCollection } from "@/features/collections/published/queries/published-collections.query";
import { toPublishedCollection } from "@/features/collections/published/to-published-collection";
import { publicProcedures } from "@/procedures";

/** 公開している作品集を slug で返す procedure。 */
export const getPublishedCollection = publicProcedures.collections.get.handler(
  async ({ context, errors, input }) => {
    const rows = await readPublishedCollection(context.db, input.slug);
    const collection = toPublishedCollection(rows, context.relyingParty.origin);

    if (collection === undefined) throw errors.NOT_FOUND();

    return collection;
  },
);
