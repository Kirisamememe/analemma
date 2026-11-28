import type { AppContext } from "@/context";
import {
  listPendingImageIds,
  markFailed,
} from "@/features/images/creating/queries/pending-image.query";
import { startPendingConversion } from "@/features/images/creating/run-pending-conversion";

/** 止まる前に受け取った画像の変換を続け、変換を待つ画像の無い原本を消す。 */
export const resumePendingImages = async (
  context: AppContext,
): Promise<void> => {
  const imageIds = await listPendingImageIds(context.db);

  await context.pending.sweep(new Set(imageIds));

  for (const imageId of imageIds) {
    if (await context.pending.restore(imageId)) {
      startPendingConversion(context, imageId);
    } else {
      await markFailed(context.db, { id: imageId, failure: "interrupted" });
      context.logger.write({
        level: "warn",
        message:
          "変換を待つ画像の原本が無いので、変換を終えられなかった状態にした",
        details: { imageId },
      });
    }
  }
};
