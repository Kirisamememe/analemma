import { changeImageTag } from "@/features/images/editing/queries/image-tag-assignment.query";
import { adminProcedures } from "@/procedures";

/** 画像にタグを付ける procedure。 */
export const addImageTag = adminProcedures.images.addTag.handler(
  async ({ context, errors, input }) => {
    const found = await context.db.transaction((tx) =>
      changeImageTag(tx, { ...input, change: "add" }),
    );

    if (!found) throw errors.NOT_FOUND();

    context.logger.write({
      level: "info",
      message: "画像にタグを付けた",
      details: { imageId: input.id, tagId: input.tagId },
    });
  },
);
