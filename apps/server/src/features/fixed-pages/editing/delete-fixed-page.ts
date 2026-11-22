import { deleteFixedPage as deleteFixedPageRow } from "@/features/fixed-pages/editing/delete-fixed-page.query";
import { adminProcedures } from "@/procedures";

/** 固定ページを消す procedure。 */
export const deleteFixedPage = adminProcedures.fixedPages.delete.handler(
  async ({ context, errors, input }) => {
    if (!(await deleteFixedPageRow(context.db, input.id))) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "固定ページを消した",
      details: { fixedPageId: input.id },
    });
  },
);
