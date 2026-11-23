import { rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

/** 名前を付けたファイルを書き、読み、消す置き場所。 */
export type FileStorage = {
  /** 名前のファイルに bytes を書く。 */
  readonly write: (key: string, bytes: Uint8Array) => Promise<void>;
  /** 名前のファイルを読む。 */
  readonly read: (key: string) => Promise<Blob | undefined>;
  /** 名前のファイルを消す。 */
  readonly remove: (keys: readonly string[]) => Promise<void>;
};

const FILE_KEY = /^[0-9a-z_\-]+(?:\/[0-9a-z_\-]+)*\.[0-9a-z]+$/v;

const toPath = (root: string, key: string): string => {
  if (!FILE_KEY.test(key)) {
    throw new Error(
      `置き場所のファイルの名前に使えない: ${JSON.stringify(key)}`,
    );
  }

  return join(root, key);
};

/** フォルダを、ファイルの置き場所として開く。 */
export const openFileStorage = async (
  directory: string,
): Promise<FileStorage> => {
  const root = resolve(directory);

  if (!(await stat(root)).isDirectory()) {
    throw new Error(`フォルダではない: ${root}`);
  }

  return {
    write: async (key, bytes) => {
      await Bun.write(toPath(root, key), bytes);
    },
    read: async (key) => {
      const file = Bun.file(toPath(root, key));

      return (await file.exists()) ? file : undefined;
    },
    remove: async (keys) => {
      const paths = keys.map((key) => toPath(root, key));

      await Promise.all(paths.map(async (path) => rm(path, { force: true })));
    },
  };
};
