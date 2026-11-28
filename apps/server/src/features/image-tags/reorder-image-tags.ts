import { reorderTags } from "@/features/image-tags/queries/image-tags.query";
import { adminProcedures } from "@/procedures";

/** すべての画像タグを並べ直す procedure。 */
export const reorderImageTags = adminProcedures.imageTags.reorder.handler(
  async ({ context, errors, input }) => {
    if (!(await reorderTags(context.db, input.tagIds))) {
      throw errors.ORDER_MISMATCH();
    }

    context.logger.write({
      level: "info",
      message: "画像のタグを並べ直した",
      details: { count: input.tagIds.length },
    });
  },
);
