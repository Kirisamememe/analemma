import { findBrowseNeighbors } from "@/features/images/reading/queries/find-browse-neighbors.query";
import { adminProcedures } from "@/procedures";

/** 画像ビューアで、現在の一覧に沿って移動できる画像を返す procedure。 */
export const getBrowseNeighbors =
  adminProcedures.images.browseNeighbors.handler(
    async ({ context, errors, input }) => {
      const neighbors = await findBrowseNeighbors(context.db, input);

      if (neighbors === undefined) throw errors.NOT_FOUND();

      return neighbors;
    },
  );
