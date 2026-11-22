import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { readDatabaseEnv } from "@/platform/env";
import { COMPOSE_PROJECT } from "@/platform/test-database/start-test-postgres";
import { TEST_POSTGRES } from "@/platform/test-database/to-test-database-target";

const SERVER_ROOT = join(import.meta.dirname, "../../../..");

const serviceSchema = z.object({
  ports: z.tuple([z.string()]),
  environment: z.object({ POSTGRES_PASSWORD: z.string() }),
});

const compose = z
  .object({
    name: z.string(),
    services: z.object({
      postgres: serviceSchema,
      "postgres-test": serviceSchema,
    }),
    configs: z.object({ "create-app-role": z.object({ content: z.string() }) }),
  })
  .parse(
    Bun.YAML.parse(
      readFileSync(join(SERVER_ROOT, "../../compose.yaml"), "utf8"),
    ),
  );

const { app, admin } = TEST_POSTGRES.roles;

test("起動のスクリプトと compose.yaml で、project の名前がそろっていること", () => {
  expect(compose.name).toBe(COMPOSE_PROJECT);
});

test("テスト用の接続先が、compose.yaml のテスト用のポートと superuser にそろっていること", () => {
  const service = compose.services["postgres-test"];

  expect(service.ports[0]).toBe(
    `${TEST_POSTGRES.host}:${String(TEST_POSTGRES.port)}:5432`,
  );
  expect(admin.username).toBe("postgres");
  expect(service.environment.POSTGRES_PASSWORD).toBe(admin.password);
});

test("アプリのロールが、compose.yaml の init で作るロールと DB にそろっていること", () => {
  expect(compose.configs["create-app-role"].content).toBe(
    `CREATE ROLE ${app.username} LOGIN PASSWORD '${app.password}';\nCREATE DATABASE ${app.username} OWNER ${app.username};\n`,
  );
});

test(".env.example の接続先が、compose.yaml の開発用のポートとアプリのロールにそろっていること", () => {
  const example = readFileSync(join(SERVER_ROOT, ".env.example"), "utf8");
  const values = Object.fromEntries(
    example
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => [
        line.slice(0, line.indexOf("=")),
        line.slice(line.indexOf("=") + 1),
      ]),
  );
  const { database } = readDatabaseEnv(values);

  expect(compose.services.postgres.ports[0]).toBe(
    `${database.host}:${String(database.port)}:5432`,
  );
  expect(database).toMatchObject({ ...app, database: app.username });
});
