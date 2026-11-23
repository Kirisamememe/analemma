import { listImages as listImageRows } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-admin-image";
import { adminProcedures } from "@/procedures";

/** 公開しているかによらず、画像を新しく足した順に、1ページずつ返す procedure。 */
export const listImages = adminProcedures.images.list.handler(
  async ({ context, input }) => {
    const rows = await listImageRows(context.db, {
      before: input.cursor,
      limit: input.limit + 1,
    });

    const page = rows.slice(0, input.limit);
    const last = page.at(-1);

    return {
      images: page.map((row) => toAdminImage(row)),
      nextCursor:
        rows.length > input.limit && last !== undefined ? last.id : null,
    };
  },
);
