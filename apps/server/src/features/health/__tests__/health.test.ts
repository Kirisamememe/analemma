import { expect, test } from "bun:test";

import { createTestClient } from "@/test-client";

test("ログインしていなくても、server の状態を返すこと", async () => {
  await using server = await createTestClient();

  expect(await server.internal().public.health.get()).toEqual({ status: "ok" });
});
