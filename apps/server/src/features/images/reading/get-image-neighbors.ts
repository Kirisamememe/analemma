import { findBrowseNeighbors } from "@/features/images/reading/queries/find-browse-neighbors.query";
import { adminProcedures } from "@/procedures";

/** 前後の画像の ID を返す procedure。 */
export const getImageNeighbors = adminProcedures.images.neighbors.handler(
  async ({ context, errors, input }) => {
    const neighbors = await findBrowseNeighbors(context.db, input);

    if (neighbors === undefined) throw errors.NOT_FOUND();

    return { newer: neighbors.previous, older: neighbors.next };
  },
);
