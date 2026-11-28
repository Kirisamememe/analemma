import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { listImageRows } from "@/features/images/reading/queries/image-list.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 公開しているかによらず、画像を指定の条件で1ページずつ返す procedure。 */
export const listImages = adminProcedures.images.list.handler(
  async ({ context, input }) =>
    context.db.transaction(
      async (tx) => {
        const rows = await listImageRows(tx, {
          ...input,
          limit: input.limit + 1,
        });

        const page = rows.slice(0, input.limit);
        const last = page.at(-1);

        const nextCursor =
          last === undefined || rows.length <= input.limit
            ? null
            : input.order === "title"
              ? `${last.id}:${last.title ?? ""}`
              : last.id;

        const deliveryImages = Map.groupBy(
          await listDeliveryImages(
            tx,
            page.map(({ id }) => id),
          ),
          ({ imageId }) => imageId,
        );

        return {
          images: page.map((row) =>
            toAdminImage(row, deliveryImages.get(row.id) ?? []),
          ),
          nextCursor,
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    ),
);
