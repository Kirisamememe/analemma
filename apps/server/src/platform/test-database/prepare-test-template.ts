import type postgres from "postgres";

import { migrateDatabase } from "@/db/migrate-database";
import {
  MIGRATIONS_FOLDER,
  type MigrationFingerprint,
  readMigrations,
} from "@/db/read-migrations";
import type { Logger } from "@/platform/logger";
import { connectTestAdmin } from "@/platform/test-database/connect-test-admin";
import { nameTestTemplate } from "@/platform/test-database/name-test-template";
import {
  TEST_POSTGRES,
  toTestDatabaseTarget,
} from "@/platform/test-database/to-test-database-target";

/** テンプレートの DB を用意するための設定。 */
export type PrepareTestTemplateOptions = {
  /** PostgreSQL からの通知を書き出す logger。 */
  readonly logger: Logger;
  /** 適用する migration のフォルダ。 */
  readonly migrationsFolder?: string;
  /** テンプレートの DB の名前。 */
  readonly template?: string;
};

const exists = async (
  sql: postgres.ReservedSql,
  name: string,
): Promise<boolean> => {
  const rows = await sql`select 1 from pg_database where datname = ${name}`;

  return rows.length > 0;
};

const dropIfExists = async (
  sql: postgres.ReservedSql,
  name: string,
): Promise<void> => {
  if (await exists(sql, name)) {
    await sql`alter database ${sql(name)} with is_template false`;
    await sql`drop database ${sql(name)} with (force)`;
  }
};

const sameMigrations = (
  applied: readonly MigrationFingerprint[],
  expected: readonly MigrationFingerprint[],
): boolean =>
  JSON.stringify(applied.map(({ hash, name }) => [name, hash])) ===
  JSON.stringify(expected.map(({ hash, name }) => [name, hash]));

/** migration を適用したテンプレートの DB を用意する。 */
export const prepareTestTemplate = async ({
  logger,
  migrationsFolder = MIGRATIONS_FOLDER,
  template,
}: PrepareTestTemplateOptions): Promise<void> => {
  const migrations = readMigrations(migrationsFolder);
  const name = template ?? nameTestTemplate(migrations);
  const building = `${name}_building`;
  await using stack = new AsyncDisposableStack();
  const admin = stack.use(connectTestAdmin());
  const sql = await admin.sql.reserve();

  stack.defer(() => {
    sql.release();
  });

  await sql`select pg_advisory_lock(hashtext(${name}))`;

  if (await exists(sql, name)) {
    return;
  }

  await dropIfExists(sql, building);
  await sql`
    create database ${sql(building)}
    template template0 owner ${sql(TEST_POSTGRES.roles.app.username)}
  `;
  stack.defer(async () => dropIfExists(sql, building));

  const { applied } = await migrateDatabase({
    target: toTestDatabaseTarget(building),
    logger,
    migrationsFolder,
  });

  if (!sameMigrations(applied, migrations)) {
    throw new Error(
      "テンプレートに適用した migration が、名前を決めたときの migration と違う。migration を書き換え終えてから、もう一度流す。",
    );
  }

  await sql`
    alter database ${sql(building)}
    with is_template true allow_connections false
  `;
  await sql`alter database ${sql(building)} rename to ${sql(name)}`;
};
