import type { AppContext } from "@/context";
import { wasRegistrationAborted } from "@/features/images/creating/queries/image-registration.query";
import type { DatabaseExecutor } from "@/platform/database";
import type { AvifImage } from "@/platform/images/encode-avif";

/** 置き場所に書いた、配信用の画像のファイル。 */
export type DeliveryFile = {
  /** 幅(px)。 */
  readonly width: number;
  /** 高さ(px)。 */
  readonly height: number;
  /** 置き場所の中のファイルの名前。 */
  readonly fileKey: string;
};

/** 登録した結果と、登録したトランザクションの ID。 */
export type Registered<T> = {
  /** 登録したトランザクションの ID。 */
  readonly transactionId: string;
  /** 登録した結果。 */
  readonly value: T;
};

/** 置き場所に書く配信用の画像と、そのファイルを DB に登録する関数。 */
export type DeliveryRegistration<T> = {
  /** 幅の段ごとの配信用の画像。 */
  readonly images: readonly AvifImage[];
  /** 書いたファイルを、渡されたトランザクションの中で DB に登録する関数。 */
  readonly register: (
    tx: DatabaseExecutor,
    files: readonly DeliveryFile[],
  ) => Promise<Registered<T> | undefined>;
};

/** 配信用の画像のファイルを書いてから DB に登録し、登録が確定しなければ書いたファイルを消す。 */
export const storeDeliveryImages = async <T>(
  { db, storage }: Pick<AppContext, "db" | "storage">,
  { images, register }: DeliveryRegistration<T>,
): Promise<T | undefined> => {
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

  const files = images.map(({ width, height, avif }) => ({
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
    const done = await register(
      tx,
      files.map(({ width, height, fileKey }) => ({ width, height, fileKey })),
    );

    transactionId = done?.transactionId;

    return done;
  });

  registered = result !== undefined;

  return result?.value;
};
