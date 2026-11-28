import { listImages as listImageRows } from "@/features/images/queries/images.query";
import { readImageRelations } from "@/features/images/queries/read-image-relations.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 公開しているかによらず、画像を新しく足した順に、1ページずつ返す procedure。 */
export const listImages = adminProcedures.images.list.handler(
  async ({ context, input }) =>
    context.db.transaction(
      async (tx) => {
        const rows = await listImageRows(tx, {
          before: input.cursor,
          limit: input.limit + 1,
        });

        const page = rows.slice(0, input.limit);
        const last = page.at(-1);

        const relations = await readImageRelations(
          tx,
          page.map(({ id }) => id),
        );

        return {
          images: page.map((row) => toAdminImage(row, relations.get(row.id))),
          nextCursor:
            rows.length > input.limit && last !== undefined ? last.id : null,
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    ),
);
