import {
  findImage,
  findNeighborIds,
} from "@/features/images/queries/images.query";
import { adminProcedures } from "@/procedures";

/** 公開しているかによらず、一覧の並びで画像の前後の画像の ID を返す procedure。 */
export const getImageNeighbors = adminProcedures.images.neighbors.handler(
  async ({ context, errors, input }) => {
    const row = await findImage(context.db, input.id);

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    const { newer, older } = await findNeighborIds(context.db, row.id);

    return { newer: newer ?? null, older: older ?? null };
  },
);
