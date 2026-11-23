import { setPublished } from "@/features/fixed-pages/publishing/queries/set-published.query";
import { toFixedPageSummary } from "@/features/fixed-pages/to-fixed-page-detail";
import { adminProcedures } from "@/procedures";

/** 固定ページを非公開に戻す procedure。 */
export const unpublishFixedPage = adminProcedures.fixedPages.unpublish.handler(
  async ({ context, errors, input }) => {
    const row = await setPublished(context.db, {
      id: input.id,
      published: false,
      now: context.clock.now(),
    });

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "固定ページを非公開に戻した",
      details: { fixedPageId: row.id },
    });

    return toFixedPageSummary(row);
  },
);
