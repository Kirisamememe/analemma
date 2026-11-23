import { findNeighborIds } from "@/features/images/queries/images.query";
import { toAdminImageNeighbors } from "@/features/images/to-admin-image";
import { adminProcedures } from "@/procedures";

/** 前後の画像の ID を返す procedure。 */
export const getImageNeighbors = adminProcedures.images.neighbors.handler(
  async ({ context, errors, input }) => {
    const neighbors = await findNeighborIds(context.db, input.id);

    if (neighbors === undefined) throw errors.NOT_FOUND();

    return toAdminImageNeighbors(neighbors);
  },
);
