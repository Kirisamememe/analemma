import { adminProcedures } from "../../../procedures";
import { listFixedPages } from "../fixed-pages.query";
import { toFixedPageSummary } from "../to-fixed-page-detail";
import { coversAllPages } from "./covers-all-pages";
import {
  lockFixedPageIds,
  updatePositions,
} from "./fixed-page-positions.query";

/** すべての固定ページを、渡した順に並べ直す procedure。 */
export const reorderFixedPages = adminProcedures.fixedPages.reorder.handler(
  async ({ context, errors, input }) => {
    const rows = await context.db.transaction(async (tx) => {
      const existing = await lockFixedPageIds(tx);

      if (!coversAllPages({ existing, requested: input.ids })) {
        return undefined;
      }

      await updatePositions(tx, input.ids);

      return listFixedPages(tx);
    });

    if (rows === undefined) {
      throw errors.ORDER_MISMATCH();
    }

    context.logger.write({
      level: "info",
      message: "固定ページを並べ直した",
      details: { count: rows.length },
    });

    return { pages: rows.map((row) => toFixedPageSummary(row)) };
  },
);
