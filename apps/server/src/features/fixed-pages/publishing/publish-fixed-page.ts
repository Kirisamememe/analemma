import { adminProcedures } from "../../../procedures";
import { toFixedPageSummary } from "../to-fixed-page-detail";
import { setPublished } from "./set-published.query";

/** 固定ページを公開する procedure。 */
export const publishFixedPage = adminProcedures.fixedPages.publish.handler(
  async ({ context, errors, input }) => {
    const row = await setPublished(context.db, {
      id: input.id,
      published: true,
      now: context.clock.now(),
    });

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "固定ページを公開した",
      details: { fixedPageId: row.id },
    });

    return toFixedPageSummary(row);
  },
);
