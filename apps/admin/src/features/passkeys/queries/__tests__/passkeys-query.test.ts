import { expect, test } from "bun:test";

import { loadPasskeys } from "@/features/passkeys/queries/passkeys-query";
import { createFakeApi } from "@/testing/create-fake-api";

test("パスキーの一覧を server から読むこと", async () => {
  const { api, calls } = createFakeApi({
    "admin/passkeys/list": () => ({ output: { passkeys: [] } }),
  });

  expect(await loadPasskeys(api)).toEqual({ passkeys: [] });
  expect(calls).toEqual(["admin/passkeys/list"]);
});
