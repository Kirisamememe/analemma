import { expect, test } from "bun:test";

import { openDatabase } from "@/platform/database";
import { readDatabaseEnv } from "@/platform/env";
import type { LogEntry } from "@/platform/logger";

const logs: LogEntry[] = [];

const logger = {
  write: (entry: LogEntry) => {
    logs.push(entry);
  },
};

const OTHER_TARGET = {
  PGHOST: "elsewhere.invalid",
  PGPORT: "6543",
  PGDATABASE: "other",
  PGUSER: "other",
  PGPASSWORD: "other",
};

test("PG で始まる環境変数があっても、DATABASE_URL から読んだ接続先だけを postgres.js に渡すこと", async () => {
  await using stack = new AsyncDisposableStack();

  const previous = Object.entries(OTHER_TARGET).map(
    ([name]) => [name, Bun.env[name]] as const,
  );

  stack.defer(() => {
    for (const [name, value] of previous) {
      if (value === undefined) {
        Reflect.deleteProperty(Bun.env, name);
      } else {
        Bun.env[name] = value;
      }
    }
  });
  Object.assign(Bun.env, OTHER_TARGET);

  const { database } = readDatabaseEnv({
    DATABASE_URL: "postgres://analemma:s3cret@db.example/analemma",
  });

  const connection = stack.use(openDatabase({ target: database, logger }));

  expect(connection.client.options).toMatchObject({
    host: ["db.example"],
    port: [5432],
    database: "analemma",
    user: "analemma",
    pass: "s3cret",
  });
});
