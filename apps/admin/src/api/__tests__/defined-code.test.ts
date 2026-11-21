import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { definedCode } from "../defined-code";

describe("definedCode", () => {
  test("contract に定義した失敗の code を返す", () => {
    expect(definedCode(new ORPCError("LAST_PASSKEY", { defined: true }))).toBe(
      "LAST_PASSKEY",
    );
  });

  test("定義していない失敗と、ほかの Error には code を返さない", () => {
    expect(definedCode(new ORPCError("INTERNAL_SERVER_ERROR"))).toBeUndefined();
    expect(definedCode(new Error("LAST_PASSKEY"))).toBeUndefined();
  });
});
