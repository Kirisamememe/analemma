import {
  type ImportContext,
  importPhoto,
} from "@/features/dropbox/importing/import-photo";
import {
  failRemaining,
  finishRun,
  withPhotoStatus,
} from "@/features/dropbox/importing/import-run";

const FAILED = { status: "failed", imageId: null } as const;

/** 始めた取り込みの写真を、リクエストの外で1枚ずつ取り込む。 */
export const runDropboxImport = async (
  context: Omit<ImportContext, "added">,
): Promise<void> => {
  const { imports } = context.dropbox;
  const photos = imports.current()?.photos ?? [];
  const added = new Map<string, string>();

  for (const [index, photo] of photos.entries()) {
    if (photo.status !== "waiting") continue;

    imports.update(
      withPhotoStatus(index, { status: "importing", imageId: null }),
    );

    try {
      // oxlint-disable-next-line eslint/no-await-in-loop -- 写真は1枚ずつ読み、変換のキューにも1枚ずつ並べる
      const outcome = await importPhoto({ ...context, added }, photo);

      if (outcome._tag === "ConnectionLost") {
        imports.update(failRemaining(index));
        context.logger.write({
          level: "warn",
          message: "Dropbox との接続が切れたので、残りの写真を取り込まなかった",
          details: {},
        });
        break;
      }

      const { change } = outcome;

      if (
        change.status === "added" &&
        change.imageId !== null &&
        photo.contentHash !== null
      ) {
        added.set(photo.contentHash, change.imageId);
      }

      imports.update(withPhotoStatus(index, change));
    } catch (error) {
      context.logger.write({
        level: "error",
        message: "Dropbox の写真を取り込めなかった",
        details: { fileId: photo.id, error },
      });
      imports.update(withPhotoStatus(index, FAILED));
    }
  }

  imports.update(finishRun(context.clock.now()));
};
