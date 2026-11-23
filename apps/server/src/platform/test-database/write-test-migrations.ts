import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** テストのために一時的なフォルダへ書いた migration。 */
export type TestMigrations = AsyncDisposable & {
  /** migration を書いたフォルダ。 */
  readonly folder: string;
  /** 1件の migration の SQL を書く。 */
  readonly rewrite: (name: string, body: string) => Promise<void>;
};

/** migration の名前と SQL から、drizzle-kit と同じ形のフォルダを一時的に作る。 */
export const writeTestMigrations = async (
  migrations: Readonly<Record<string, string>>,
): Promise<TestMigrations> => {
  await using stack = new AsyncDisposableStack();
  const folder = await mkdtemp(join(tmpdir(), "analemma-migrations-"));

  stack.defer(async () => rm(folder, { recursive: true }));

  const rewrite = async (name: string, body: string): Promise<void> => {
    await mkdir(join(folder, name), { recursive: true });
    await writeFile(join(folder, name, "migration.sql"), body);
  };

  const written = await Promise.allSettled(
    Object.entries(migrations).map(async ([name, body]) => rewrite(name, body)),
  );

  const failed = written.find((result) => result.status === "rejected");

  if (failed !== undefined) {
    throw new Error("一時的な migration を書けなかった。", {
      cause: failed.reason,
    });
  }

  const resources = stack.move();

  return {
    folder,
    rewrite,
    [Symbol.asyncDispose]: async () => resources.disposeAsync(),
  };
};
