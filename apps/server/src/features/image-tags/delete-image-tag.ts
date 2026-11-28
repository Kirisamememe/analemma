import { deleteUnusedTag } from "@/features/image-tags/queries/image-tags.query";
import { adminProcedures } from "@/procedures";

/** 画像に付いていないタグを消す procedure。 */
export const deleteImageTag = adminProcedures.imageTags.delete.handler(
  async ({ context, errors, input }) => {
    const result = await deleteUnusedTag(context.db, input.id);

    if (result._tag === "Missing") throw errors.NOT_FOUND();

    if (result._tag === "InUse") throw errors.TAG_IN_USE();

    context.logger.write({
      level: "info",
      message: "画像のタグを消した",
      details: { tagId: input.id },
    });
  },
);
