import { expect, test } from "bun:test";

import { sendLogOut, sendLogOutAll } from "@/features/session/queries/log-out";
import { createFakeApi } from "@/testing/create-fake-api";

test("今のセッションからのログアウトを送ること", async () => {
  const { api, calls } = createFakeApi({
    "admin/session/logOut": () => ({ output: undefined }),
  });

  await sendLogOut(api);

  expect(calls).toEqual(["admin/session/logOut"]);
});

test("すべてのセッションからのログアウトを送り、ログアウトしたセッションの数を返すこと", async () => {
  const { api, calls } = createFakeApi({
    "admin/session/logOutAll": () => ({ output: { loggedOut: 3 } }),
  });

  expect(await sendLogOutAll(api)).toEqual({ loggedOut: 3 });
  expect(calls).toEqual(["admin/session/logOutAll"]);
});
