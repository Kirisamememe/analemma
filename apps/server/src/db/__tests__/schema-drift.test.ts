import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MIGRATIONS_FOLDER } from "../read-migrations";

const SERVER_ROOT = join(import.meta.dirname, "../../..");
const DRIZZLE_KIT = join(SERVER_ROOT, "node_modules/.bin/drizzle-kit");
const GENERATE_TIMEOUT_MS = 60_000;

test(
  "テーブル定義に合う migration が、すでに生成してあること",
  async () => {
    await using stack = new AsyncDisposableStack();
    const folder = await mkdtemp(join(tmpdir(), "analemma-schema-drift-"));

    stack.defer(async () => rm(folder, { recursive: true, force: true }));

    const out = join(folder, "migrations");
    const config = join(folder, "drizzle.config.ts");

    await cp(MIGRATIONS_FOLDER, out, { recursive: true });
    await writeFile(
      config,
      [
        `import config from ${JSON.stringify(join(SERVER_ROOT, "drizzle.config.ts"))};`,
        `export default { ...config, out: ${JSON.stringify(out)} };`,
      ].join("\n"),
    );

    const before = await readdir(out);
    const generated = spawnSync(
      process.execPath,
      [DRIZZLE_KIT, "generate", "--config", config],
      {
        cwd: SERVER_ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: GENERATE_TIMEOUT_MS,
      },
    );

    expect(`${generated.stdout}${generated.stderr}`).toContain(
      "No schema changes",
    );
    expect(generated.status).toBe(0);
    expect(await readdir(out)).toEqual(before);
  },
  GENERATE_TIMEOUT_MS,
);
