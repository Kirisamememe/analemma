import type { MigrationFingerprint } from "./read-migrations";

/** 適用した後に、フォルダの側で変わった migration の名前。 */
export type ChangedMigrations = {
  /** SQL が書き換えられた migration。 */
  readonly rewritten: string[];
  /** フォルダから消えた(名前を変えたものを含む)migration。 */
  readonly missing: string[];
};

/** 適用済みの migration と、フォルダにある migration を照らし合わせる。 */
export const findChangedMigrations = (
  applied: readonly MigrationFingerprint[],
  local: readonly MigrationFingerprint[],
): ChangedMigrations => {
  const localHashes = new Map(local.map(({ hash, name }) => [name, hash]));

  return {
    rewritten: applied
      .filter(({ hash, name }) => {
        const localHash = localHashes.get(name);

        return localHash !== undefined && localHash !== hash;
      })
      .map(({ name }) => name),
    missing: applied
      .filter(({ name }) => !localHashes.has(name))
      .map(({ name }) => name),
  };
};
