import { expect, test } from "bun:test";
import { spawn, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";

import type { LogEntry } from "@/platform/logger";
import { createTestDatabase } from "@/platform/test-database/create-test-database";
import { toTestDatabaseUrl } from "@/platform/test-database/to-test-database-url";

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
  details: z.object({
    port: z.number(),
    internalPort: z.number(),
    internalHost: z.literal("127.0.0.1"),
  }),
});

type StartedPorts = z.output<typeof startedSchema>["details"];

const readStartedPorts = (line: string): StartedPorts | undefined => {
  const parsed = startedSchema.safeParse(
    line.startsWith("{") ? JSON.parse(line) : undefined,
  );

  return parsed.success ? parsed.data.details : undefined;
};

const postHealth = async (port: number): Promise<number> =>
  (
    await fetch(`http://127.0.0.1:${String(port)}/api/public/health/get`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: null }),
    })
  ).status;

test("2つのポートで待ち受け、SIGTERM を受けると、受け付けを止め、止めることをログに書いて終わること", async () => {
  await using database = await createTestDatabase({ logger });
  await using stack = new AsyncDisposableStack();

  const server = spawn(process.execPath, ["--no-env-file", MAIN], {
    env: {
      PORT: "0",
      INTERNAL_PORT: "0",
      DATABASE_URL: toTestDatabaseUrl(database.name),
      AUTH_ORIGIN: "https://analemma.test",
      AUTH_RP_ID: "analemma.test",
      MEDIA_DIR: tmpdir(),
    },
  });

  const lines: string[] = [];
  let pending = "";
  let stderr = "";
  const started = Promise.withResolvers<StartedPorts>();

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

      const ports = readStartedPorts(line);

      if (ports !== undefined) {
        started.resolve(ports);
      }
    }
  });

  const ports = await Promise.race([
    started.promise,
    closed.then((code) => {
      throw new Error(
        `server が起動の前に終わった(終了コード ${String(code)})。\n${stderr}`,
      );
    }),
  ]);

  const statuses = [
    await postHealth(ports.internalPort),
    await postHealth(ports.port),
  ];

  server.kill("SIGTERM");

  expect(statuses).toEqual([200, 404]);
  expect(await closed).toBe(0);
  expect(lines.join("\n")).toContain("Analemma を止める");
});

test("MEDIA_DIR のフォルダが無いと、ポートを開く前に、変数の名前を添えて止まること", () => {
  const result = spawnSync(process.execPath, ["--no-env-file", MAIN], {
    env: {
      PORT: "0",
      INTERNAL_PORT: "0",
      DATABASE_URL: "postgres://test:test@127.0.0.1:1/test",
      AUTH_ORIGIN: "https://analemma.test",
      AUTH_RP_ID: "analemma.test",
      MEDIA_DIR: join(tmpdir(), "analemma-missing-media"),
    },
    encoding: "utf8",
    timeout: STOP_DEADLINE_MS,
  });

  expect(result.status).toBe(1);
  expect(result.stderr).toContain("MEDIA_DIR");
  expect(result.stdout).not.toContain("Analemma を起動した");
});
