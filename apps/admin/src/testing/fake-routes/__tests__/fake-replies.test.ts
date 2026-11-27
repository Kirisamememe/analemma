import { expect, test } from "bun:test";

import { failedReply, pendingReply } from "../fake-replies";

test("想定外の失敗は、contract に定義していない失敗として返すこと", () => {
  expect(failedReply()).toEqual({
    error: "INTERNAL_SERVER_ERROR",
    defined: false,
  });
});

test("届かない応答は、待っても決着しないこと", async () => {
  const settled = await Promise.race([
    pendingReply<string>().then(() => "settled"),
    new Promise<string>((resolve) => {
      setTimeout(resolve, 10, "pending");
    }),
  ]);

  expect(settled).toBe("pending");
});
