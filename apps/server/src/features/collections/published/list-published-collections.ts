import { listPublishedCollectionRows } from "@/features/collections/published/queries/published-collections.query";
import { toPublishedCollectionList } from "@/features/collections/published/to-published-collection";
import { publicProcedures } from "@/procedures";

/** 公開しているコレクションとカバーの画像を、新しく作った順に返す procedure。 */
export const listPublishedCollections =
  publicProcedures.collections.list.handler(async ({ context }) => {
    const rows = await listPublishedCollectionRows(context.db);

    return toPublishedCollectionList(rows, context.relyingParty.origin);
  });
