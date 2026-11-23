import type { AppContext } from "@/context";
import {
  insertImage,
  insertDeliveryImages,
} from "@/features/images/creating/queries/insert-image.query";
import { createDeliveryImages } from "@/features/images/processing/create-delivery-images";
import { readShotInfo } from "@/features/images/processing/read-shot-info";
import { findImage } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-admin-image";

type ImageContext = Pick<AppContext, "clock" | "db" | "storage">;

/** 写真1枚から撮影の情報と配信用の画像を作り、公開の画像として登録する。 */
export const createImage = async (
  { clock, db, storage }: ImageContext,
  bytes: Uint8Array,
) => {
  const delivery = await createDeliveryImages(bytes);

  if (delivery._tag === "UnsupportedFormat") return delivery;

  const shot = await readShotInfo(bytes);
  const written: string[] = [];
  let committing: string | undefined;
  let registered = false;
  await using rollback = new AsyncDisposableStack();
  rollback.defer(async () => {
    if (registered || written.length === 0) return;

    if (
      committing !== undefined &&
      (await findImage(db, committing)) !== undefined
    ) {
      return;
    }

    await storage.remove(written);
  });

  const result = await db.transaction(async (tx) => {
    const row = await insertImage(tx, { shot, now: clock.now() });

    const files = delivery.images.map(({ width, height, avif }) => ({
      avif,
      row: {
        imageId: row.id,
        width,
        height,
        fileKey: `${row.id}-${width}.avif`,
      },
    }));

    const rows = files.map((file) => file.row);
    await insertDeliveryImages(tx, rows);

    for (const { row: file, avif } of files) {
      written.push(file.fileKey);
      // oxlint-disable-next-line eslint/no-await-in-loop -- 失敗した書き込みの後始末より後に別のファイルを作らない
      await storage.write(file.fileKey, avif);
    }

    const created = toAdminImage(row, rows);
    committing = row.id;

    return created;
  });

  registered = true;

  return { _tag: "Created", image: result } as const;
};
