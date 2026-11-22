import { describe, expect, test } from "bun:test";

import { readEnrollmentToken } from "@/features/auth/read-enrollment-token";

describe("readEnrollmentToken", () => {
  test("# の後ろを token として読む", () => {
    expect(readEnrollmentToken("#abc.def")).toBe("abc.def");
  });

  test("# の付かない hash(TanStack Router の location)も読む", () => {
    expect(readEnrollmentToken("abc.def")).toBe("abc.def");
  });

  test("# の後ろが無ければ、token は無い", () => {
    expect(readEnrollmentToken("")).toBeUndefined();
    expect(readEnrollmentToken("#")).toBeUndefined();
  });
});
