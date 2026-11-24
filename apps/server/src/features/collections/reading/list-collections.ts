import { listCollectionRows } from "@/features/collections/reading/queries/collections.query";
import { toAdminCollection } from "@/features/collections/to-admin-collection";
import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 作品集を新しく作った順に返す procedure。 */
export const listCollections = adminProcedures.collections.list.handler(
  ({ context }) =>
    context.db.transaction(
      async (tx) => {
        const rows = await listCollectionRows(tx);

        const coverIds = rows.flatMap(({ cover }) =>
          cover === null ? [] : [cover.id],
        );

        const deliveries = Map.groupBy(
          await listDeliveryImages(tx, coverIds),
          (item) => item.imageId,
        );

        return {
          collections: rows.map(({ collection, imageCount, cover }) => {
            const coverImage =
              cover === null
                ? null
                : toAdminImage(cover, deliveries.get(cover.id) ?? []);

            return Object.assign(toAdminCollection(collection), {
              imageCount,
              coverImage,
            });
          }),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    ),
);
