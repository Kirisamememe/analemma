import { describe, expect, test } from "bun:test";

import { createTestApp } from "../create-test-app";

describe("createTestApp", () => {
  test("最初に開くパスを履歴に持ち、router が読み込むと procedure の呼び出しを残す", async () => {
    const { history, calls, router } = createTestApp({
      path: "/security",
      routes: {
        "admin/session/get": () => ({ error: "UNAUTHORIZED" }),
      },
    });

    expect(history.location.pathname).toBe("/security");

    await router.load();

    expect(calls).toEqual(["admin/session/get"]);
    expect(router.state.location.pathname).toBe("/login");
  });
});
