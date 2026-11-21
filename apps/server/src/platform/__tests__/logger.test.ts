import { expect, test } from "bun:test";

import { formatLogLine } from "../logger";

test("1件のログを、改行で終わる1行の JSON にすること", () => {
  const line = formatLogLine({
    level: "info",
    message: "起動した",
    details: { port: 8787 },
  });

  expect(line.endsWith("\n")).toBe(true);
  expect(line.trimEnd()).not.toContain("\n");
  expect(JSON.parse(line)).toEqual({
    level: "info",
    message: "起動した",
    details: { port: 8787 },
  });
});

test("Error の名前・メッセージ・cause・スタックを失わないこと", () => {
  const cause = new Error("接続が切れた");
  const error = new TypeError("DB に接続できない", { cause });
  const logged: unknown = JSON.parse(
    formatLogLine({ level: "error", message: "失敗した", details: { error } }),
  );

  expect(logged).toMatchObject({
    details: {
      error: {
        name: "TypeError",
        message: "DB に接続できない",
        cause: { name: "Error", message: "接続が切れた" },
      },
    },
  });
  expect(JSON.stringify(logged)).toContain("logger.test.ts");
});

test("BigInt や循環する値があっても、ログを書けること", () => {
  const circular: Record<string, unknown> = { name: "親" };

  circular["self"] = circular;

  const logged: unknown = JSON.parse(
    formatLogLine({
      level: "info",
      message: "値を書く",
      details: { circular, count: 10n },
    }),
  );

  expect(logged).toMatchObject({
    details: { circular: { name: "親", self: "[Circular]" }, count: "10" },
  });
});

test("Error でない cause は書かないこと", () => {
  const error = new Error("失敗した", {
    cause: { cookie: "analemma_session=secret" },
  });
  const line = formatLogLine({
    level: "error",
    message: "失敗した",
    details: { error },
  });

  expect(line).not.toContain("secret");
});
