import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { definedCode, isUnauthorized } from "../api-errors";

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

describe("isUnauthorized", () => {
  test("UNAUTHORIZED の失敗を、セッションが無いことと見分ける", () => {
    expect(isUnauthorized(new ORPCError("UNAUTHORIZED"))).toBe(true);
  });

  test("ほかの失敗は、セッションが無いことと見なさない", () => {
    expect(isUnauthorized(new ORPCError("FORBIDDEN"))).toBe(false);
    expect(isUnauthorized(new Error("UNAUTHORIZED"))).toBe(false);
    expect(isUnauthorized(undefined)).toBe(false);
  });
});
