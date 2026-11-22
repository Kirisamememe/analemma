import { sql } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate } from "drizzle-orm/pg-core/async/session";

import { findChangedMigrations } from "@/db/find-changed-migrations";
import { readAppliedMigrations } from "@/db/read-applied-migrations";
import {
  MIGRATIONS_FOLDER,
  type MigrationFingerprint,
} from "@/db/read-migrations";
import { type DatabaseTarget, openDatabase } from "@/platform/database";
import type { Logger } from "@/platform/logger";

/** migration を適用するための設定。 */
export type MigrateDatabaseOptions = {
  /** つなぐ DB と、つなぐときのロール。 */
  readonly target: DatabaseTarget;
  /** PostgreSQL からの通知を書き出す logger。 */
  readonly logger: Logger;
  /** 適用する migration のフォルダ。 */
  readonly migrationsFolder?: string;
};

/** migration を適用した結果。 */
export type MigrateDatabaseResult = {
  /** 適用済みの migration の一覧(前から適用してあったものを含む)。 */
  readonly applied: MigrationFingerprint[];
  /** 今回適用した migration の数。 */
  readonly added: number;
};

const LOCK_KEY = "analemma:migrate";

/** migration を適用する。 */
export const migrateDatabase = async ({
  logger,
  migrationsFolder = MIGRATIONS_FOLDER,
  target,
}: MigrateDatabaseOptions): Promise<MigrateDatabaseResult> => {
  const migrations = readMigrationFiles({ migrationsFolder });
  await using connection = openDatabase({ target, logger, max: 1 });

  return await connection.db.transaction(async (tx) => {
    const [role] = await tx.execute(
      sql`select current_setting('is_superuser') = 'on' as superuser`,
      "objects",
    );

    if (role?.["superuser"] !== false) {
      throw new Error(
        "superuser では migration を適用しない。superuser でないロールでつなぐ。",
      );
    }

    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${LOCK_KEY}))`);

    const before = await readAppliedMigrations(tx);
    const { missing, rewritten } = findChangedMigrations(before, migrations);

    if (rewritten.length > 0 || missing.length > 0) {
      throw new Error(
        `適用済みの migration が、フォルダの側で変わっている(書き換え:${rewritten.join("、") || "なし"}、消えたもの:${missing.join("、") || "なし"})。適用済みの migration は書き換えず、消さず、新しい migration を足す。`,
      );
    }

    await migrate(migrations, tx, { migrationsFolder });

    const applied = await readAppliedMigrations(tx);

    return { applied, added: applied.length - before.length };
  });
};
