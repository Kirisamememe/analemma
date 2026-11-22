import { sql } from "drizzle-orm";
import type { PgAsyncDatabase } from "drizzle-orm/pg-core/async/db";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js/session";
import { z } from "zod";

import type { MigrationFingerprint } from "@/db/read-migrations";

const appliedSchema = z.array(
  z.object({ name: z.string().nullable(), hash: z.string() }),
);

/** DB に記録された、適用済みの migration の名前と SQL の hash を読む。 */
export const readAppliedMigrations = async (
  db: PgAsyncDatabase<PostgresJsQueryResultHKT>,
): Promise<MigrationFingerprint[]> => {
  const [table] = await db.execute(
    sql`select to_regclass('drizzle.__drizzle_migrations') is not null as found`,
    "objects",
  );

  if (table?.["found"] !== true) {
    return [];
  }

  const rows = await db.execute(
    sql`select name, hash from drizzle.__drizzle_migrations order by id`,
    "objects",
  );

  return appliedSchema
    .parse(rows)
    .flatMap(({ hash, name }) => (name === null ? [] : [{ name, hash }]));
};
