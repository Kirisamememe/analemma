import { adminProcedures } from "../../../procedures";
import { toFixedPageSummary } from "../to-fixed-page-detail";
import { setPublished } from "./set-published.query";

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
