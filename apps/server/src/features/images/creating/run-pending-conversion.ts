import type { AppContext } from "@/context";
import { convertPendingImage } from "@/features/images/creating/convert-pending-image";
import { markFailed } from "@/features/images/creating/queries/pending-image.query";

/** 変換を待つ画像の変換を、リクエストの外で始める。 */
export const startPendingConversion = (
  context: AppContext,
  imageId: string,
): void => {
  const run = async (): Promise<void> => {
    try {
      const outcome = await convertPendingImage(context, imageId);

      if (outcome === "stopped") return;

      context.logger.write({
        level: outcome === "published" ? "info" : "warn",
        message: "受け取った写真の変換を終えた",
        details: { imageId, outcome },
      });
    } catch (error) {
      context.logger.write({
        level: "error",
        message: "受け取った写真を変換できなかった",
        details: { imageId, error },
      });

      try {
        await markFailed(context.db, imageId);
        await context.pending.discard(imageId);
      } catch (cause) {
        context.logger.write({
          level: "error",
          message: "変換できなかった写真を、変換失敗にできなかった",
          details: { imageId, error: cause },
        });
      }
    }
  };

  context.pending.track(run());
};
