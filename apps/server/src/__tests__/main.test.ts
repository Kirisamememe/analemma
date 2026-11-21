import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";

import type { LogEntry } from "../platform/logger";
import { createTestDatabase } from "../platform/test-database/create-test-database";
import { toTestDatabaseUrl } from "../platform/test-database/to-test-database-url";

const MAIN = join(import.meta.dirname, "../main.ts");
const STOP_DEADLINE_MS = 5000;

const logs: LogEntry[] = [];
const logger = {
  write: (entry: LogEntry) => {
    logs.push(entry);
  },
};

const startedSchema = z.object({
  message: z.literal("Analemma を起動した"),
  details: z.object({ port: z.number() }),
});

const readStartedPort = (line: string): number | undefined => {
  const parsed = startedSchema.safeParse(
    line.startsWith("{") ? JSON.parse(line) : undefined,
  );

  return parsed.success ? parsed.data.details.port : undefined;
};

test("SIGTERM を受けると、受け付けを止め、止めることをログに書いて終わること", async () => {
  await using database = await createTestDatabase({ logger });
  await using stack = new AsyncDisposableStack();
  const server = spawn(process.execPath, ["--no-env-file", MAIN], {
    env: {
      PORT: "0",
      DATABASE_URL: toTestDatabaseUrl(database.name),
      AUTH_ORIGIN: "https://analemma.test",
      AUTH_RP_ID: "analemma.test",
    },
  });
  const lines: string[] = [];
  let pending = "";
  let stderr = "";
  const started = Promise.withResolvers<number>();
  const closed = new Promise<number | null>((resolve) => {
    server.once("close", resolve);
  });

  stack.defer(async () => {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill("SIGKILL");
    }

    await Promise.race([closed, sleep(STOP_DEADLINE_MS)]);
  });
  server.once("error", started.reject);
  server.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  server.stdout.on("data", (chunk: Buffer) => {
    const parts = `${pending}${chunk.toString()}`.split("\n");

    pending = parts.pop() ?? "";

    for (const line of parts) {
      lines.push(line);

      const port = readStartedPort(line);

      if (port !== undefined) {
        started.resolve(port);
      }
    }
  });

  const port = await Promise.race([
    started.promise,
    closed.then((code) => {
      throw new Error(
        `server が起動の前に終わった(終了コード ${String(code)})。\n${stderr}`,
      );
    }),
  ]);
  const response = await fetch(
    `http://127.0.0.1:${String(port)}/api/public/health/get`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: null }),
    },
  );

  server.kill("SIGTERM");

  expect(response.status).toBe(200);
  expect(await closed).toBe(0);
  expect(lines.join("\n")).toContain("Analemma を止める");
});
