import { expect, test } from "bun:test";
import { join } from "node:path";

import drizzleConfig from "../../../drizzle.config";
import { MIGRATIONS_FOLDER } from "../read-migrations";

const SERVER_ROOT = join(import.meta.dirname, "../../..");

test("migration を適用するフォルダが、drizzle-kit が書き出すフォルダと同じであること", () => {
  expect(join(SERVER_ROOT, drizzleConfig.out ?? "")).toBe(MIGRATIONS_FOLDER);
});
