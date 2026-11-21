import { readMigrationFiles } from "drizzle-orm/migrator";
import { join } from "node:path";

/** drizzle-kit が migration を書き出すフォルダ。 */
export const MIGRATIONS_FOLDER = join(import.meta.dirname, "migrations");

/** 1件の migration の名前と、SQL の hash。 */
export type MigrationFingerprint = {
  /** migration のフォルダの名前。 */
  readonly name: string;
  /** migration の SQL の hash。 */
  readonly hash: string;
};

/** フォルダにある migration の、名前と SQL の hash を読む。 */
export const readMigrations = (
  migrationsFolder: string = MIGRATIONS_FOLDER,
): MigrationFingerprint[] =>
  readMigrationFiles({ migrationsFolder }).map(({ hash, name }) => ({
    name,
    hash,
  }));
