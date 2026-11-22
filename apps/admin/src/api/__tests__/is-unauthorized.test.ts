import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { isUnauthorized } from "../is-unauthorized";

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
