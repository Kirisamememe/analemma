import { findImage } from "@/features/images/queries/images.query";
import { readImageRelations } from "@/features/images/queries/read-image-relations.query";
import { toAdminImage } from "@/features/images/to-image";
import { adminProcedures } from "@/procedures";

/** 公開しているかによらず、画像を返す procedure。 */
export const getImage = adminProcedures.images.get.handler(
  async ({ context, errors, input }) => {
    const image = await context.db.transaction(
      async (tx) => {
        const row = await findImage(tx, input.id);

        if (!row) return undefined;

        const relations = await readImageRelations(tx, [row.id]);

        return toAdminImage(row, relations.get(row.id));
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );

    if (image === undefined) {
      throw errors.NOT_FOUND();
    }

    return image;
  },
);
