import { renameTag } from "@/features/image-tags/queries/image-tags.query";
import { adminProcedures } from "@/procedures";

/** 画像のタグの名前を変える procedure。 */
export const renameImageTag = adminProcedures.imageTags.rename.handler(
  async ({ context, errors, input }) => {
    const result = await renameTag(context.db, input);

    if (result._tag === "Missing") throw errors.NOT_FOUND();

    if (result._tag === "NameTaken") throw errors.NAME_TAKEN();

    context.logger.write({
      level: "info",
      message: "画像のタグの名前を変えた",
      details: { tagId: input.id },
    });

    return result.row;
  },
);
