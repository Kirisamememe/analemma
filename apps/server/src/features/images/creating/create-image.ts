import type { AppContext } from "@/context";
import {
  insertImage,
  insertDeliveryImages,
  wasRegistrationAborted,
} from "@/features/images/creating/queries/image-registration.query";
import { createDeliveryImages } from "@/features/images/processing/create-delivery-images";
import { readShotInfo } from "@/features/images/processing/read-shot-info";
import { toAdminImage } from "@/features/images/to-admin-image";

type ImageContext = Pick<
  AppContext,
  "clock" | "conversions" | "db" | "storage"
> & {
  /** 写真を待つのをやめたことを知らせる signal。 */
  readonly signal?: AbortSignal | undefined;
};

/** 写真1枚から撮影の情報を読み、配信用の画像を登録する。 */
export const createImage = async (
  { clock, conversions, db, storage, signal }: ImageContext,
  bytes: Uint8Array,
) => {
  const delivery = await conversions.run(
    async () => createDeliveryImages(bytes),
    signal,
  );

  signal?.throwIfAborted();

  if (delivery._tag === "UnsupportedFormat") return delivery;

  const shot = await readShotInfo(bytes);
  const written: string[] = [];
  let transactionId: string | undefined;
  let registered = false;
  await using rollback = new AsyncDisposableStack();
  rollback.defer(async () => {
    if (registered || written.length === 0) return;

    if (
      transactionId !== undefined &&
      !(await wasRegistrationAborted(db, transactionId))
    ) {
      return;
    }

    await storage.remove(written);
  });

  const prefix = crypto.randomUUID();

  const files = delivery.images.map(({ width, height, avif }) => ({
    width,
    height,
    avif,
    fileKey: `${prefix}-${width}.avif`,
  }));

  for (const file of files) {
    written.push(file.fileKey);
    // oxlint-disable-next-line eslint/no-await-in-loop -- 失敗した書き込みの後始末より後に別のファイルを作らない
    await storage.write(file.fileKey, file.avif);
  }

  const result = await db.transaction(async (tx) => {
    const row = await insertImage(tx, { shot, now: clock.now() });
    transactionId = row.transactionId;

    const rows = files.map(({ width, height, fileKey }) => ({
      imageId: row.id,
      width,
      height,
      fileKey,
    }));

    await insertDeliveryImages(tx, rows);

    return toAdminImage(row, rows);
  });

  registered = true;

  return { _tag: "Created", image: result } as const;
};
