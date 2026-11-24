import { readCollectionRows } from "@/features/collections/reading/queries/collections.query";
import { toAdminCollection } from "@/features/collections/to-admin-collection";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** コレクションと並び順どおりの画像を返す procedure。 */
export const getCollection = adminProcedures.collections.get.handler(
  async ({ context, errors, input }) => {
    const rows = await readCollectionRows(context.db, input.id);
    const [first] = rows;

    if (first === undefined) throw errors.NOT_FOUND();

    const byImage = Map.groupBy(rows, (row) => row.image?.id);

    const images = Array.from(byImage.values()).flatMap((group) => {
      const image = group[0]?.image;

      if (!image) return [];

      const deliveries = group.flatMap(
        ({ deliveryImage }) => deliveryImage ?? [],
      );

      return [toAdminImage(image, deliveries)];
    });

    return { ...toAdminCollection(first.collection), images };
  },
);
