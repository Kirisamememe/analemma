import { lockKindFields } from "@/features/fixed-pages/editing/queries/lock-kind-fields.query";
import { saveFixedPage } from "@/features/fixed-pages/editing/queries/save-fixed-page.query";
import { toFixedPageDetail } from "@/features/fixed-pages/to-fixed-page-detail";
import { checkContent } from "@/features/kinds/check-content";
import { adminProcedures } from "@/procedures";

/** 選んだ種類が無いこと。 */
type UnknownKind = {
  /** どの結果か。 */
  readonly _tag: "UnknownKind";
};

const UNKNOWN_KIND: UnknownKind = { _tag: "UnknownKind" };

/** 種類を選んで、公開していない固定ページを作る procedure。 */
export const createFixedPage = adminProcedures.fixedPages.create.handler(
  async ({ context, errors, input }) => {
    const result = await context.db.transaction(async (tx) => {
      const fields = await lockKindFields(tx, input.kind);

      if (fields === undefined) {
        return UNKNOWN_KIND;
      }

      const checked = checkContent({ fields, content: input.content });

      if (checked._tag === "Invalid") {
        return checked;
      }

      return saveFixedPage(tx, {
        id: undefined,
        kind: input.kind,
        slug: input.slug,
        title: input.title,
        content: checked.content,
        now: context.clock.now(),
      });
    });

    switch (result._tag) {
      case "UnknownKind":
        throw errors.UNKNOWN_KIND();
      case "Invalid":
        throw errors.INVALID_CONTENT({ data: { issues: result.issues } });
      case "SlugTaken":
        throw errors.SLUG_TAKEN();
      case "Saved":
        context.logger.write({
          level: "info",
          message: "固定ページを作った",
          details: { fixedPageId: result.row.id, kind: result.row.kind },
        });

        return toFixedPageDetail(result.row);
    }
  },
);
