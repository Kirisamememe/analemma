import { readMigrations } from "@/db/read-migrations";
import { type DatabaseConnection, openDatabase } from "@/platform/database";
import type { Logger } from "@/platform/logger";
import { connectTestAdmin } from "@/platform/test-database/connect-test-admin";
import { nameTestTemplate } from "@/platform/test-database/name-test-template";
import {
  TEST_POSTGRES,
  toTestDatabaseTarget,
} from "@/platform/test-database/to-test-database-target";

/** 1つのテストのために作った DB の接続。 */
export type TestDatabase = DatabaseConnection & {
  /** 作った DB の名前。 */
  readonly name: string;
};

/** テストの DB を作るための設定。 */
export type TestDatabaseOptions = {
  /** PostgreSQL からの通知を書き出す logger。 */
  readonly logger: Logger;
  /** 元にするテンプレートの DB の名前。 */
  readonly template?: string;
};

const TEST_POOL_SIZE = 2;

const createDatabase = async (
  name: string,
  template: string,
): Promise<void> => {
  await using admin = connectTestAdmin();
  const { sql } = admin;
  const found = await sql`
    select 1 from pg_database where datname = ${template}
  `;

  if (found.length === 0) {
    throw new Error(
      `テストの DB の元になるテンプレート ${template} が無い。bun run test で作る(migration を変えたら作り直す)。`,
    );
  }

  await sql`
    create database ${sql(name)}
    template ${sql(template)} owner ${sql(TEST_POSTGRES.roles.app.username)}
  `;
};

const dropDatabase = async (name: string): Promise<void> => {
  await using admin = connectTestAdmin();
  const { sql } = admin;

  await sql`drop database ${sql(name)} with (force)`;
};

/** テンプレートの DB から、1つのテストのための DB を作る。 */
export const createTestDatabase = async ({
  logger,
  template = nameTestTemplate(readMigrations()),
}: TestDatabaseOptions): Promise<TestDatabase> => {
  const name = `analemma_test_${crypto.randomUUID().replaceAll("-", "")}`;

  await createDatabase(name, template);

  await using stack = new AsyncDisposableStack();

  stack.defer(async () => dropDatabase(name));

  const database = stack.use(
    openDatabase({
      target: toTestDatabaseTarget(name),
      logger,
      max: TEST_POOL_SIZE,
    }),
  );
  const resources = stack.move();

  return {
    db: database.db,
    client: database.client,
    name,
    [Symbol.asyncDispose]: () => resources.disposeAsync(),
  };
};
