import type { AppContext } from "@/context";
import {
  listPendingImageIds,
  markFailed,
} from "@/features/images/creating/queries/pending-image.query";
import { startPendingConversion } from "@/features/images/creating/run-pending-conversion";

/** 止まる前に受け取って変換を終えていない画像を、原本があれば変換し直し、無ければ変換失敗にする。 */
export const resumePendingImages = async (
  context: AppContext,
): Promise<void> => {
  for (const imageId of await listPendingImageIds(context.db)) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- 受け取った順に並べる
    if (await context.pending.restore(imageId)) {
      startPendingConversion(context, imageId);
    } else {
      // oxlint-disable-next-line eslint/no-await-in-loop -- 受け取った順に並べる
      await markFailed(context.db, imageId);
      context.logger.write({
        level: "warn",
        message: "変換を待つ画像の原本が無いので、変換失敗にした",
        details: { imageId },
      });
    }
  }
};
