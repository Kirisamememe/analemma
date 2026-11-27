import type { FileStorage } from "@/platform/file-storage/open-file-storage";

/** 変換を待つ原本の置き場所と、リクエストの外で進める変換の見張り。 */
export type PendingPhotos = {
  /** 置いてある原本の合計が上限に達しているか。 */
  readonly isFull: () => boolean;
  /** 画像の原本を置く。 */
  readonly put: (imageId: string, bytes: Uint8Array) => Promise<void>;
  /** 起動の前に置いた原本があるかを確かめ、あれば置いてある量に数える。 */
  readonly restore: (imageId: string) => Promise<boolean>;
  /** 画像の原本を読む。 */
  readonly read: (imageId: string) => Promise<Uint8Array | undefined>;
  /** 画像の原本を消す。 */
  readonly discard: (imageId: string) => Promise<void>;
  /** 渡した画像のほかの原本を、置き場所から消す。 */
  readonly sweep: (keep: ReadonlySet<string>) => Promise<void>;
  /** リクエストの外で進める変換を覚える。 */
  readonly track: (work: Promise<void>) => void;
  /** 覚えている変換がすべて終わるのを待つ。 */
  readonly settle: () => Promise<void>;
  /** 止め始めたか。 */
  readonly isStopping: () => boolean;
  /** 新しい変換を始めさせず、進めている変換が終わるのを待つ。 */
  readonly stop: () => Promise<void>;
};

/** 新しい写真を受け取らなくなる、置いてある原本の合計(bytes)。 */
export const PENDING_PHOTOS_LIMIT = 1024 * 1024 * 1024;

const FOLDER = "pending";

const toKey = (imageId: string): string => `${FOLDER}/${imageId}.bin`;

/** 配信用の画像の置き場所の中に、変換を待つ原本の置き場所を作る。 */
export const createPendingPhotos = (
  storage: FileStorage,
  limit = PENDING_PHOTOS_LIMIT,
): PendingPhotos => {
  const sizes = new Map<string, number>();
  const works = new Set<Promise<void>>();
  let stopping = false;

  const stored = (): number => sizes.values().reduce((a, b) => a + b, 0);

  const settle = async (): Promise<void> => {
    while (works.size > 0) {
      // oxlint-disable-next-line eslint/no-await-in-loop -- 待つ間に足された変換も待つ
      await Promise.allSettled(works);
    }
  };

  return {
    isFull: () => stored() >= limit,
    put: async (imageId, bytes) => {
      await storage.write(toKey(imageId), bytes);
      sizes.set(imageId, bytes.byteLength);
    },
    restore: async (imageId) => {
      const file = await storage.read(toKey(imageId));

      if (file === undefined) return false;

      sizes.set(imageId, file.size);

      return true;
    },
    read: async (imageId) => {
      const file = await storage.read(toKey(imageId));

      return file === undefined ? undefined : file.bytes();
    },
    discard: async (imageId) => {
      await storage.remove([toKey(imageId)]);
      sizes.delete(imageId);
    },
    sweep: async (keep) => {
      const kept = new Set([...keep].map((imageId) => toKey(imageId)));
      const keys = await storage.list(FOLDER);

      await storage.remove(keys.filter((key) => !kept.has(key)));
    },
    track: (work) => {
      works.add(work);
      void work.finally(() => {
        works.delete(work);
      });
    },
    settle,
    isStopping: () => stopping,
    stop: async () => {
      stopping = true;
      await settle();
    },
  };
};
