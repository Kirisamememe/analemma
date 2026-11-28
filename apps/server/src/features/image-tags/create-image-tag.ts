import { appendTag } from "@/features/image-tags/queries/image-tags.query";
import { adminProcedures } from "@/procedures";

/** 画像のタグを作る procedure。 */
export const createImageTag = adminProcedures.imageTags.create.handler(
  async ({ context, errors, input }) => {
    const tag = await appendTag(context.db, input.name);

    if (!tag) throw errors.NAME_TAKEN();

    context.logger.write({
      level: "info",
      message: "画像のタグを作った",
      details: { tagId: tag.id },
    });

    return tag;
  },
);
