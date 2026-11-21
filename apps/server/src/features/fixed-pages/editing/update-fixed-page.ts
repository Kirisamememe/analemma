import { adminProcedures } from "../../../procedures";
import { checkContent } from "../../kinds/check-content";
import { toFixedPageDetail } from "../to-fixed-page-detail";
import { lockFixedPage } from "./lock-fixed-page.query";
import { lockKindFields } from "./lock-kind-fields.query";
import { saveFixedPage } from "./save-fixed-page.query";

/** 書き換える固定ページが無いこと。 */
type MissingPage = {
  /** 結果の種類。 */
  readonly _tag: "Missing";
};

const MISSING: MissingPage = { _tag: "Missing" };

/** 固定ページのタイトル・slug・中身を書き換える procedure。 */
export const updateFixedPage = adminProcedures.fixedPages.update.handler(
  async ({ context, errors, input }) => {
    const result = await context.db.transaction(async (tx) => {
      const page = await lockFixedPage(tx, input.id);

      if (page === undefined) {
        return MISSING;
      }

      const fields = await lockKindFields(tx, page.kind);

      if (fields === undefined) {
        throw new Error("固定ページの種類の行が無い");
      }

      const checked = checkContent({ fields, content: input.content });

      if (checked._tag === "Invalid") {
        return checked;
      }

      return saveFixedPage(tx, {
        id: page.id,
        kind: page.kind,
        slug: input.slug,
        title: input.title,
        content: checked.content,
        now: context.clock.now(),
      });
    });

    switch (result._tag) {
      case "Missing":
        throw errors.NOT_FOUND();
      case "Invalid":
        throw errors.INVALID_CONTENT({ data: { issues: result.issues } });
      case "SlugTaken":
        throw errors.SLUG_TAKEN();
      case "Saved":
        context.logger.write({
          level: "info",
          message: "固定ページを書き換えた",
          details: { fixedPageId: result.row.id },
        });

        return toFixedPageDetail(result.row);
    }
  },
);
