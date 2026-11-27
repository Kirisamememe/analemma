import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { isUnauthorized, isUnavailable } from "@/api/api-errors";

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

describe("isUnavailable", () => {
  test("SERVICE_UNAVAILABLE の失敗を、server が今は受けられないことと見分ける", () => {
    expect(isUnavailable(new ORPCError("SERVICE_UNAVAILABLE"))).toBe(true);
  });

  test("ほかの失敗は、server が今は受けられないことと見なさない", () => {
    expect(isUnavailable(new ORPCError("INTERNAL_SERVER_ERROR"))).toBe(false);
    expect(isUnavailable(new Error("SERVICE_UNAVAILABLE"))).toBe(false);
  });
});
