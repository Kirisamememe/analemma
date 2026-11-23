import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { systemClock } from "@/platform/clock";
import { toTestDatabaseUrl } from "@/platform/test-database/to-test-database-url";
import {
  SUCCEEDED,
  catchErrorCode,
  TEST_ORIGIN,
  TEST_RP_ID,
  createTestClient,
} from "@/test-client";

const ENROLL = join(import.meta.dirname, "../enroll.ts");

const runEnroll = (env: Record<string, string>) =>
  spawnSync(process.execPath, ["--no-env-file", ENROLL], {
    env,
    encoding: "utf8",
  });

const tokenOf = (stdout: string): string =>
  new URL(stdout.trim()).hash.slice(1);

test("登録用 URL だけを標準出力に1行で書き、その token で登録の options を取れること", async () => {
  await using server = await createTestClient({ clock: systemClock });

  const env = {
    DATABASE_URL: toTestDatabaseUrl(server.databaseName),
    AUTH_ORIGIN: TEST_ORIGIN,
    AUTH_RP_ID: TEST_RP_ID,
  };

  const first = runEnroll(env);
  const second = runEnroll(env);

  expect([first.status, second.status]).toEqual([0, 0]);
  expect(first.stdout).toMatch(
    /^https:\/\/analemma\.test\/enroll#[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}\n$/v,
  );
  expect(first.stderr).toContain("1回だけ使える");
  expect(first.stderr).toContain("登録用 URL を出した");
  expect(first.stderr).not.toContain(tokenOf(first.stdout).split(".")[1]);
  expect(
    await catchErrorCode(
      server.client.auth.enrollment.options({ token: tokenOf(first.stdout) }),
    ),
  ).toBe("INVALID_ENROLLMENT");
  expect(
    await catchErrorCode(
      server.client.auth.enrollment.options({ token: tokenOf(second.stdout) }),
    ),
  ).toBe(SUCCEEDED);
});

test("AUTH_ORIGIN が無いと、変数の名前を添えて失敗すること", () => {
  const result = runEnroll({
    DATABASE_URL: "postgres://analemma:s3cret@127.0.0.1:1/analemma",
    AUTH_RP_ID: TEST_RP_ID,
  });

  expect(result.status).not.toBe(0);
  expect(result.stdout).toBe("");
  expect(result.stderr).toContain("AUTH_ORIGIN: 設定されていない");
});
