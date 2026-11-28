import type { AppContext } from "@/context";
import { insertPendingImage } from "@/features/images/creating/queries/pending-image.query";
import { deleteImage } from "@/features/images/editing/queries/delete-image.query";
import { readShotInfo } from "@/features/images/processing/read-shot-info";
import { toAdminImage } from "@/features/images/to-image";

type ReceivingContext = Pick<AppContext, "clock" | "db" | "pending">;

/** 写真1枚から撮影の情報を読み、変換を待つ画像を作って、原本を置き場所に置く。 */
export const receivePhoto = async (
  { clock, db, pending }: ReceivingContext,
  bytes: Uint8Array,
) => {
  const shot = await readShotInfo(bytes);
  const row = await insertPendingImage(db, { shot, now: clock.now() });
  let stored = false;
  await using rollback = new AsyncDisposableStack();
  rollback.defer(async () => {
    if (stored) return;

    await pending.discard(row.id);
    await deleteImage(db, row.id);
  });

  await pending.put(row.id, bytes);
  stored = true;

  return toAdminImage(row, undefined);
};
