import { changeImageTag } from "@/features/images/editing/queries/image-tag-assignment.query";
import { adminProcedures } from "@/procedures";

/** 画像からタグを外す procedure。 */
export const removeImageTag = adminProcedures.images.removeTag.handler(
  async ({ context, errors, input }) => {
    const found = await context.db.transaction((tx) =>
      changeImageTag(tx, { ...input, change: "remove" }),
    );

    if (!found) throw errors.NOT_FOUND();

    context.logger.write({
      level: "info",
      message: "画像からタグを外した",
      details: { imageId: input.id, tagId: input.tagId },
    });
  },
);
