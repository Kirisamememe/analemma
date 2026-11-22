import { listFixedPages } from "@/features/fixed-pages/fixed-pages.query";
import { coversAllPages } from "@/features/fixed-pages/ordering/covers-all-pages";
import {
  lockFixedPageIds,
  updatePositions,
} from "@/features/fixed-pages/ordering/fixed-page-positions.query";
import { toFixedPageSummary } from "@/features/fixed-pages/to-fixed-page-detail";
import { adminProcedures } from "@/procedures";

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
