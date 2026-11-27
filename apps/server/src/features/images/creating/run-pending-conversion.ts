import type { AppContext } from "@/context";
import {
  createPendingDelivery,
  publishPendingImage,
} from "@/features/images/creating/convert-pending-image";
import {
  type ConversionFailure,
  markFailed,
} from "@/features/images/creating/queries/pending-image.query";

/** 変換できなかった画像と、その理由。 */
type Failure = {
  /** 画像の ID。 */
  readonly imageId: string;
  /** 変換できなかった理由を表す、画像の状態。 */
  readonly failure: ConversionFailure;
  /** 受け止めた、想定外の失敗。 */
  readonly error?: unknown;
};

const fail = async (
  context: AppContext,
  { imageId, failure, error }: Failure,
): Promise<void> => {
  context.logger.write({
    level: error === undefined ? "warn" : "error",
    message: "受け取った写真を変換できなかった",
    details: { imageId, failure, error },
  });

  try {
    await markFailed(context.db, { id: imageId, failure });
    await context.pending.discard(imageId);
  } catch (cause) {
    context.logger.write({
      level: "error",
      message: "変換できなかった写真の状態を書けなかった",
      details: { imageId, error: cause },
    });
  }
};

const convert = async (context: AppContext, imageId: string) => {
  try {
    return await createPendingDelivery(context, imageId);
  } catch (error) {
    await fail(context, { imageId, failure: "unreadable", error });

    return "stopped";
  }
};

const run = async (context: AppContext, imageId: string): Promise<void> => {
  const delivery = await convert(context, imageId);

  if (delivery === "stopped") return;

  if (delivery === "original-missing") {
    await fail(context, { imageId, failure: "interrupted" });

    return;
  }

  if (delivery._tag === "UnsupportedFormat") {
    await fail(context, { imageId, failure: "unreadable" });

    return;
  }

  try {
    const outcome = await publishPendingImage(context, {
      imageId,
      images: delivery.images,
    });

    context.logger.write({
      level: "info",
      message: "受け取った写真の変換を終えた",
      details: { imageId, outcome },
    });
  } catch (error) {
    await fail(context, { imageId, failure: "interrupted", error });
  }
};

/** 変換を待つ画像の変換を、リクエストの外で始める。 */
export const startPendingConversion = (
  context: AppContext,
  imageId: string,
): void => {
  context.pending.track(run(context, imageId));
};
