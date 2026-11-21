import { expect, test } from "bun:test";

import { createTestClient } from "../../../test-client/create-test-client";

test("ログインしていなくても、server の状態を返すこと", async () => {
  await using server = await createTestClient();

  expect(await server.client.public.health.get()).toEqual({ status: "ok" });
});
